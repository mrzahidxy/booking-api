import { Prisma, PropertyKind, RoomType } from "@prisma/client";
import { z } from "zod";
import { BadRequestException } from "../exceptions/bad-request";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { HTTPSuccessResponse } from "../helpers/success-response";
import { formatPaginationResponse } from "../utils/common-method";
import prisma from "../utils/prisma";
import { resolveUniqueSlug } from "../utils/slug";
import { buildPropertyWhere, resolvePropertyIdentifierWhere } from "../utils/property-query";
import { hotelSchema, roomSchema } from "../schemas/hotels";

type HotelPayload = z.infer<typeof hotelSchema>;

const HOTEL_KIND = PropertyKind.HOTEL;

export const upsertHotel = async (params: {
  hotelId: number | null;
  data: HotelPayload;
  tenantId: number;
}) => {
  const { name, location, description, amenities, image, rooms } = params.data;
  const slug = await resolveUniqueSlug(name, async (candidate) => {
    const existing = await prisma.property.findFirst({
      where: {
        slug: candidate,
        ...(params.hotelId ? { NOT: { id: params.hotelId } } : {}),
      },
      select: { id: true },
    });

    return Boolean(existing);
  });

  const existingProperty = params.hotelId
    ? await prisma.property.findFirst({
        where: { id: params.hotelId, tenantId: params.tenantId },
      })
    : await prisma.property.findUnique({
        where: { tenantId: params.tenantId },
      });

  if (existingProperty && existingProperty.kind !== HOTEL_KIND) {
    throw new BadRequestException("Tenant is already configured as a restaurant", ErrorCode.BAD_REQUEST);
  }

  let hotel;

  if (existingProperty) {
    hotel = await prisma.property.update({
      where: { id: existingProperty.id },
      data: {
        kind: HOTEL_KIND,
        name,
        slug,
        location,
        image: image ?? [],
        description,
        amenities: amenities ?? [],
        cuisine: [],
        timeSlots: [],
        seats: null,
        menu: Prisma.DbNull,
        tenantId: params.tenantId,
      },
    });
  } else {
    hotel = await prisma.property.create({
      data: {
        tenantId: params.tenantId,
        kind: HOTEL_KIND,
        slug,
        name,
        location,
        image: image ?? [],
        description,
        amenities: amenities ?? [],
        cuisine: [],
        timeSlots: [],
        seats: null,
        menu: Prisma.DbNull,
      },
    });
  }

  if (rooms !== undefined) {
    const validRooms = rooms
      .map((room) => roomSchema.safeParse(room))
      .filter((res) => res.success)
      .map((res) => res.data);

    const existingRooms = await prisma.room.findMany({
      where: { propertyId: hotel.id },
      select: { id: true },
    });

    const existingRoomIds = new Set(existingRooms.map((room) => room.id));
    const incomingRoomIds = new Set(validRooms.map((room) => room.id).filter(Boolean));

    const roomsToDelete = [...existingRoomIds].filter((id) => !incomingRoomIds.has(id));

    if (roomsToDelete.length > 0) {
      try {
        await prisma.room.deleteMany({
          where: { id: { in: roomsToDelete } },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2003"
        ) {
          throw new BadRequestException(
            "Room cannot be deleted while it has existing bookings",
            ErrorCode.BAD_REQUEST
          );
        }

        throw error;
      }
    }

    await Promise.all(
      validRooms.map(async ({ id, roomType, price, image, amenities, quantity }) => {
        if (id) {
          if (!existingRoomIds.has(id)) {
            throw new BadRequestException("Room does not belong to this hotel", ErrorCode.BAD_REQUEST);
          }

          await prisma.room.update({
            where: { id },
            data: { roomType, price: +price, image: image ?? [], amenities: amenities ?? [], quantity },
          });
        } else {
          await prisma.room.create({
            data: {
              propertyId: hotel.id,
              roomType,
              price: +price,
              image: image ?? [],
              amenities: amenities ?? [],
              quantity,
            },
          });
        }
      })
    );
  }

  return new HTTPSuccessResponse(
    `Hotel ${params.hotelId ? "updated" : "created"} successfully`,
    params.hotelId ? 200 : 201,
    hotel
  );
};

export const removeHotel = async (hotelId: number, tenantId?: number | null) => {
  const hotel = await prisma.property.findFirst({
    where: {
      id: hotelId,
      ...buildPropertyWhere(HOTEL_KIND, tenantId),
    },
    include: { rooms: true },
  });

  if (!hotel) {
    throw new NotFoundException("Hotel not found", ErrorCode.HOTEL_NOT_FOUND);
  }

  try {
    await prisma.property.delete({
      where: { id: hotelId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new BadRequestException(
        "Hotel cannot be deleted while it has existing bookings",
        ErrorCode.BAD_REQUEST
      );
    }

    throw error;
  }

  return new HTTPSuccessResponse("Hotel deleted successfully", 200, hotel);
};

export const fetchHotels = async (params: { page?: number; limit?: number; tenantId?: number | null }) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;

  const whereClause = buildPropertyWhere(HOTEL_KIND, params.tenantId);
  const hotels = await prisma.property.findMany({
    skip,
    take: limit,
    include: { rooms: true },
    where: whereClause,
  });
  const totalHotels = await prisma.property.count({ where: whereClause });

  const formattedResponse = formatPaginationResponse(hotels ?? [], totalHotels, page, limit);

  return new HTTPSuccessResponse("Hotels fetched successfully", 200, formattedResponse);
};

export const fetchHotelDetails = async (hotelIdentifier: string, tenantId?: number | null) => {
  const identifierWhere = resolvePropertyIdentifierWhere(hotelIdentifier);
  const hotel = await prisma.property.findFirst({
    where: { ...identifierWhere, ...buildPropertyWhere(HOTEL_KIND, tenantId) },
    include: {
      rooms: true,
      reviews: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!hotel) {
    const parsedId = Number(hotelIdentifier);
    const fallbackWhere = Number.isInteger(parsedId)
      ? { id: parsedId, ...buildPropertyWhere(HOTEL_KIND, tenantId) }
      : null;

    if (fallbackWhere) {
      const hotelById = await prisma.property.findFirst({
        where: fallbackWhere,
        include: {
          rooms: true,
          reviews: {
            include: {
              user: true,
            },
          },
        },
      });

      if (hotelById) {
        return new HTTPSuccessResponse("Hotel details fetched successfully", 200, hotelById);
      }
    }

    throw new NotFoundException("Hotel not found", ErrorCode.HOTEL_NOT_FOUND);
  }

  return new HTTPSuccessResponse("Hotel details fetched successfully", 200, hotel);
};

export const searchHotels = async (params: {
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  roomType?: string;
  name?: string;
  page?: number;
  limit?: number;
  tenantId?: number | null;
}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;

  const whereClause = {
    ...buildPropertyWhere(HOTEL_KIND, params.tenantId),
    ...(params.location && {
      location: {
        contains: params.location,
        mode: Prisma.QueryMode.insensitive,
      },
    }),
    ...(params.name && {
      name: {
        contains: params.name,
        mode: Prisma.QueryMode.insensitive,
      },
    }),
    rooms: {
      some: {
        ...(params.minPrice && { price: { gte: +params.minPrice } }),
        ...(params.maxPrice && { price: { lte: +params.maxPrice } }),
        ...(params.roomType && { roomType: params.roomType as RoomType }),
      },
    },
  };

  const hotels = await prisma.property.findMany({
    where: whereClause,
    include: { rooms: true },
    skip,
    take: limit,
  });

  const totalHotels = await prisma.property.count({
    where: whereClause,
  });

  if (!hotels) {
    throw new NotFoundException("Something went wrong", 404);
  }

  const formattedResponse = formatPaginationResponse(hotels ?? [], totalHotels, page, limit);

  return new HTTPSuccessResponse("Hotels fetched successfully", 200, formattedResponse);
};

export const checkRoomAvailabilityService = async (params: {
  roomId?: number;
  date?: string;
  quantity?: number;
}) => {
  const { roomId, date, quantity } = params;

  if (!roomId || !date || !quantity) {
    throw new BadRequestException("Missing required parameters", ErrorCode.BAD_REQUEST);
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { quantity: true },
  });

  if (!room) {
    throw new NotFoundException("Room not found", ErrorCode.ROOM_NOT_FOUND);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      bookingDate: new Date(date),
      status: "CONFIRMED",
    },
  });

  const totalBookedRooms = bookings.reduce(
    (total, booking) => total + (booking.roomQuantity ?? 0),
    0
  );

  const requestedQuantity = Number(quantity);

  const isAvailable = totalBookedRooms + requestedQuantity <= room.quantity;

  const availAbality = room.quantity - totalBookedRooms;

  return new HTTPSuccessResponse("Room availability checked successfully", 200, {
    isAvailable,
    availAbality,
  });
};
