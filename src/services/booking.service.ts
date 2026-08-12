import { BookingStatus, PropertyKind } from "@prisma/client";
import { BadRequestException } from "../exceptions/bad-request";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { HTTPSuccessResponse } from "../helpers/success-response";
import prisma from "../utils/prisma";
import { formatPaginationResponse } from "../utils/common-method";
import { getMessaging } from "./firebase-admin.service";
import { buildTenantWhere } from "../utils/tenant-access";

type BookingKind = "room" | "restaurant";

const getBookingKind = (booking: { property: { kind: PropertyKind } }): BookingKind => {
  if (booking.property.kind === PropertyKind.HOTEL) return "room";
  if (booking.property.kind === PropertyKind.RESTAURANT) return "restaurant";
  throw new BadRequestException("Booking type could not be determined", ErrorCode.BAD_REQUEST);
};

const withPaymentStatus = <T extends { payment?: { status: string }[] }>(bookings: T[]) =>
  bookings.map((booking) => ({
    ...booking,
    paymentStatus: booking.payment?.[0]?.status ?? "UNPAID",
  }));

export const fetchUserBookings = async (params: {
  userId?: number;
  page?: number;
  limit?: number;
}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;

  const bookings = await prisma.booking.findMany({
    skip,
    take: limit,
    where: { userId: params.userId },
    orderBy: { createdAt: "desc" },
    include: {
      payment: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      room: { include: { property: true } },
      property: true,
      user: true,
    },
  });
  const totalBookings = await prisma.booking.count({
    where: { userId: params.userId },
  });

  if (!bookings || bookings.length === 0) {
    throw new NotFoundException("No booking found", ErrorCode.BOOKING_NOT_FOUND);
  }

  const formattedResponse = formatPaginationResponse(
    withPaymentStatus(bookings),
    totalBookings,
    page,
    limit
  );

  return new HTTPSuccessResponse(
    "Bookings fetched successfully",
    200,
    formattedResponse
  );
};

export const fetchBookings = async (params: { page?: number; limit?: number; tenantId?: number | null }) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;
  const whereClause = buildTenantWhere(params.tenantId);

  const [totalBookings, bookings] = await prisma.$transaction([
    prisma.booking.count({ where: whereClause }),
    prisma.booking.findMany({
      skip,
      take: limit,
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        room: { include: { property: true } },
        property: true,
        user: true,
      },
    }),
  ]);

  if (!bookings) {
    throw new NotFoundException("No bookings found", ErrorCode.ROLE_NOT_FOUND);
  }

  const formattedResponse = formatPaginationResponse(
    withPaymentStatus(bookings),
    totalBookings,
    page,
    limit
  );

  return new HTTPSuccessResponse("Bookings fetched successfully", 200, formattedResponse);
};

export const updateBookingStatus = async (params: {
  bookingId: number;
  status: BookingStatus;
  tenantId?: number | null;
}) => {
  const { bookingId, status, tenantId } = params;

  const updatedBooking = await prisma.$transaction(async (tx) => {
    const existingBooking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        property: true,
      },
    });

    if (!existingBooking) {
      throw new NotFoundException("Booking not found", ErrorCode.BOOKING_NOT_FOUND);
    }

    if (tenantId && existingBooking.tenantId !== tenantId) {
      throw new NotFoundException("Booking not found", ErrorCode.BOOKING_NOT_FOUND);
    }

    const bookingKind = getBookingKind(existingBooking);

    if (status === "CONFIRMED") {
      if (bookingKind === "room") {
        const room = await tx.room.findUnique({
          where: { id: existingBooking.roomId! },
        });

        if (!room) {
          throw new NotFoundException("Room not found", ErrorCode.ROOM_NOT_FOUND);
        }

        const roomAvailable = room.quantity;
        const roomBooked = await tx.booking.aggregate({
          where: {
            roomId: existingBooking.roomId!,
            bookingDate: existingBooking.bookingDate,
            status: "CONFIRMED",
            ...buildTenantWhere(tenantId),
          },
          _sum: {
            roomQuantity: true,
          },
        });

        const totalBookedRooms = roomBooked._sum.roomQuantity ?? 0;
        const requestedRoomQuantity = existingBooking.roomQuantity ?? 1;
        const isAvailable = totalBookedRooms + requestedRoomQuantity <= roomAvailable;

        if (!isAvailable) {
          throw new BadRequestException("Not enough rooms available", ErrorCode.NOT_ENOUGH_ROOMS);
        }
      }

      if (bookingKind === "restaurant") {
        const seatAvailable = existingBooking.property.seats!;
        const seatBooked = await tx.booking.aggregate({
          where: {
            propertyId: existingBooking.propertyId,
            bookingDate: existingBooking.bookingDate,
            status: "CONFIRMED",
            ...buildTenantWhere(tenantId),
          },
          _sum: {
            partySize: true,
          },
        });

        const totalBookedSeats = seatBooked._sum.partySize ?? 0;
        const requestedPartySize = existingBooking.partySize ?? 1;
        const isAvailable = totalBookedSeats + requestedPartySize <= seatAvailable;

        if (!isAvailable) {
          throw new BadRequestException("Not enough seats available", ErrorCode.NOT_ENOUGH_SEATS);
        }
      }
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    await tx.notification.create({
      data: {
        userId: existingBooking.userId,
        title: "Booking status updated",
        body: `Your booking is now ${status}`,
        metadata: { bookingId: existingBooking.id },
      },
    });

    const fcmToken = existingBooking.user.fcmToken;

    if (fcmToken) {
      const message = {
        notification: {
          title: "Booking Status Updated",
          body: `Your booking status has been updated to ${status}`,
        },
        token: fcmToken,
      };

      try {
        const messaging = getMessaging();
        await messaging.send(message);
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }

    return updated;
  });

  return {
    statusCode: 200,
    body: {
      message: "Booking status updated successfully",
      booking: updatedBooking,
    },
  };
};

export const createRoomBooking = async (params: {
  userId: number;
  roomId: number;
  bookingDate: Date;
  quantity: number;
  tenantId?: number | null;
}) => {
  const { userId, roomId, bookingDate, quantity, tenantId } = params;

  const booking = await prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: { id: roomId },
      include: { property: true },
    });

    if (!room) {
      throw new NotFoundException("Room not found", ErrorCode.ROOM_NOT_FOUND);
    }

    if (tenantId != null && room.property?.tenantId !== tenantId) {
      throw new NotFoundException("Room not found", ErrorCode.ROOM_NOT_FOUND);
    }

    if (room.property.kind !== PropertyKind.HOTEL) {
      throw new BadRequestException("Room booking is only available for hotel properties", ErrorCode.BAD_REQUEST);
    }

    const resolvedTenantId = tenantId ?? room.property?.tenantId ?? null;

    const requestedQuantity = Number(quantity);
    if (requestedQuantity < 1) {
      throw new BadRequestException("Quantity must be at least 1", ErrorCode.BAD_REQUEST);
    }

    const roomBooked = await tx.booking.aggregate({
      where: {
        roomId,
        bookingDate,
        status: "CONFIRMED",
        ...buildTenantWhere(resolvedTenantId),
      },
      _sum: {
        roomQuantity: true,
      },
    });

    const totalBookedRooms = roomBooked._sum.roomQuantity ?? 0;
    const isAvailable = totalBookedRooms + requestedQuantity <= room.quantity;

    if (!isAvailable) {
      throw new BadRequestException(
        "Not enough rooms available",
        ErrorCode.NOT_ENOUGH_ROOMS
      );
    }

    const totalPrice = room.price * requestedQuantity;

    return tx.booking.create({
      data: {
        userId,
        tenantId: resolvedTenantId,
        propertyId: room.propertyId,
        roomId,
        bookingDate,
        totalPrice,
        status: "PENDING",
        roomQuantity: requestedQuantity,
      },
    });
  });

  return new HTTPSuccessResponse("Room booked successfully", 201, booking);
};
