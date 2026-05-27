import { Prisma, PropertyKind, TimeSlotType } from "@prisma/client";
import { BadRequestException } from "../exceptions/bad-request";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { HTTPSuccessResponse } from "../helpers/success-response";
import { formatPaginationResponse } from "../utils/common-method";
import prisma from "../utils/prisma";
import { resolveUniqueSlug } from "../utils/slug";
import { buildPropertyWhere, resolvePropertyIdentifierWhere } from "../utils/property-query";

const RESTAURANT_KIND = PropertyKind.RESTAURANT;

const normalizeTimeSlots = (value: unknown): TimeSlotType[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((slot): slot is TimeSlotType =>
    Object.values(TimeSlotType).includes(slot as TimeSlotType)
  );
};

export const upsertRestaurant = async (params: {
  restaurantId: number | null;
  data: {
    name: string;
    location: string;
    cuisine?: string[];
    seats?: number | null;
    menu?: unknown;
    image?: string[];
    description?: string | null;
    timeSlots?: unknown;
  };
  tenantId: number;
}) => {
  const { restaurantId, data, tenantId } = params;
  const {
    name,
    location,
    cuisine,
    seats,
    menu,
    image,
    description,
    timeSlots,
  } = data;
  const slug = await resolveUniqueSlug(name, async (candidate) => {
    const existing = await prisma.property.findFirst({
      where: {
        slug: candidate,
        ...(restaurantId ? { NOT: { id: restaurantId } } : {}),
      },
      select: { id: true },
    });

    return Boolean(existing);
  });

  const existingRestaurant = restaurantId
    ? await prisma.property.findFirst({
        where: { id: restaurantId, tenantId },
      })
    : await prisma.property.findUnique({
        where: { tenantId },
      });

  if (!restaurantId && existingRestaurant && existingRestaurant.kind !== RESTAURANT_KIND) {
    throw new BadRequestException("Tenant is already configured as a hotel", ErrorCode.BAD_REQUEST);
  }

  if (restaurantId && !existingRestaurant) {
    throw new NotFoundException("Restaurant not found", ErrorCode.RESTAURANT_NOT_FOUND);
  }

  if (existingRestaurant && existingRestaurant.kind !== RESTAURANT_KIND) {
    throw new BadRequestException("Tenant is already configured as a hotel", ErrorCode.BAD_REQUEST);
  }

  const restaurant = existingRestaurant
    ? await prisma.property.update({
        where: { id: existingRestaurant.id },
        data: {
          tenantId,
          kind: RESTAURANT_KIND,
          slug,
          name,
          location,
          description,
          cuisine: cuisine ?? [],
          image: image ?? [],
          seats,
          menu: menu ?? Prisma.DbNull,
          amenities: [],
          timeSlots: normalizeTimeSlots(timeSlots),
        },
      })
    : await prisma.property.create({
        data: {
          tenantId,
          kind: RESTAURANT_KIND,
          slug,
          name,
          location,
          description,
          cuisine: cuisine ?? [],
          image: image ?? [],
          seats,
          menu: menu ?? Prisma.DbNull,
          amenities: [],
          timeSlots: normalizeTimeSlots(timeSlots),
        },
      });

  return new HTTPSuccessResponse(
    `Restaurant ${restaurantId ? "updated" : "created"} successfully`,
    restaurantId ? 200 : 201,
    restaurant
  );
};

export const createRestaurantService = async (payload: {
  name: string;
  location: string;
  cuisine?: string[];
  seats?: number | null;
  menu?: unknown;
  image?: string[];
  description?: string | null;
  tenantId: number;
}) => {
  return upsertRestaurant({
    restaurantId: null,
    tenantId: payload.tenantId,
    data: payload,
  });
};

export const updateRestaurantService = async (params: {
  restaurantId: number;
  payload: {
    name?: string;
    location?: string;
    cuisine?: string[];
    seats?: number;
    menu?: unknown;
    image?: string[];
    description?: string | null;
    timeSlots?: unknown;
  };
  tenantId: number;
}) => {
  const { restaurantId, payload, tenantId } = params;

  return upsertRestaurant({
    restaurantId,
    tenantId,
    data: {
      name: payload.name ?? "",
      location: payload.location ?? "",
      cuisine: payload.cuisine,
      seats: payload.seats,
      menu: payload.menu,
      image: payload.image,
      description: payload.description,
      timeSlots: payload.timeSlots,
    },
  });
};

export const fetchRestaurantsService = async (params: { page?: number; limit?: number; tenantId?: number | null }) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const whereClause = buildPropertyWhere(RESTAURANT_KIND, params.tenantId);

  const restaurants = await prisma.property.findMany({
    where: whereClause,
    skip: (page - 1) * limit,
    take: limit,
    include: { bookings: true },
  });

  const totalRestaurants = await prisma.property.count({ where: whereClause });

  const formattedResponse = formatPaginationResponse(restaurants, totalRestaurants, page, limit);

  return new HTTPSuccessResponse("Restaurants fetched successfully", 200, formattedResponse);
};

export const searchRestaurantsService = async (params: {
  name?: string;
  location?: string;
  ratings?: string;
  cuisine?: string;
  page?: number;
  limit?: number;
  tenantId?: number | null;
}) => {
  const pageNumber = params.page ?? 1;
  const pageSize = params.limit ?? 10;

  const whereClause = {
    ...buildPropertyWhere(RESTAURANT_KIND, params.tenantId),
    ...(params.location && {
      location: {
        contains: params.location,
        mode: Prisma.QueryMode.insensitive,
      },
    }),
    ...(params.ratings && {
      ratings: Number(params.ratings),
    }),
    ...(params.name && {
      name: {
        contains: params.name,
        mode: Prisma.QueryMode.insensitive,
      },
    }),
    ...(params.cuisine && {
      cuisine: {
        has: params.cuisine,
      },
    }),
  };

  const restaurants = await prisma.property.findMany({
    where: whereClause,
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
  });

  if (!restaurants) {
    throw new NotFoundException("Something went wrong", 404);
  }

  const totalRestaurants = await prisma.property.count({ where: whereClause });

  const formattedResponse = formatPaginationResponse(restaurants ?? [], totalRestaurants, pageNumber, pageSize);

  return new HTTPSuccessResponse("Restaurants fetched successfully", 200, formattedResponse);
};

export const fetchRestaurantDetailsService = async (restaurantIdentifier: string, tenantId?: number | null) => {
  const identifierWhere = resolvePropertyIdentifierWhere(restaurantIdentifier);

  const restaurant = await prisma.property.findFirst({
    where: { ...identifierWhere, ...buildPropertyWhere(RESTAURANT_KIND, tenantId) },
    include: {
      bookings: true,
    },
  });

  if (!restaurant) {
    const parsedId = Number(restaurantIdentifier);
    const fallbackWhere = Number.isInteger(parsedId)
      ? { id: parsedId, ...buildPropertyWhere(RESTAURANT_KIND, tenantId) }
      : null;

    if (fallbackWhere) {
      const restaurantById = await prisma.property.findFirst({
        where: fallbackWhere,
        include: {
          bookings: true,
        },
      });

      if (restaurantById) {
        return new HTTPSuccessResponse("Restaurant details fetched successfully", 200, restaurantById);
      }
    }

    throw new NotFoundException("Restaurant not found", ErrorCode.RESTAURANT_NOT_FOUND);
  }

  return new HTTPSuccessResponse("Restaurant details fetched successfully", 200, restaurant);
};

export const checkTableAvailabilityService = async (params: {
  restaurantId?: number;
  date?: string;
  partySize?: number;
  timeSlot?: string;
}) => {
  const { restaurantId, date, partySize, timeSlot } = params;

  if (!restaurantId || !date || !timeSlot) {
    throw new BadRequestException("Missing required parameters", ErrorCode.BAD_REQUEST);
  }

  const restaurant = await prisma.property.findUnique({
    where: { id: restaurantId },
    select: { seats: true },
  });

  if (!restaurant) {
    throw new NotFoundException("Restaurant not found", ErrorCode.RESTAURANT_NOT_FOUND);
  }

  const availability = await prisma.booking.findMany({
    where: {
      propertyId: restaurantId,
      bookingDate: new Date(date),
      status: "CONFIRMED",
      timeSlot,
    },
  });

  const totalBookedSeats = availability.reduce(
    (total, booking) => total + (booking.partySize ?? 0),
    0
  );

  const requestedPartySize = partySize ?? 1;

  const isAvailable = totalBookedSeats + requestedPartySize <= restaurant.seats!;
  const availAbality = restaurant.seats! - totalBookedSeats;

  return new HTTPSuccessResponse("Table availability checked successfully", 200, {
    isAvailable,
    availAbality,
  });
};

export const reserveTableService = async (params: {
  userId?: number;
  restaurantId: number;
  bookingDate: Date;
  partySize?: number | null;
  timeSlot: string;
  tenantId?: number | null;
}) => {
  const { userId, restaurantId, bookingDate, partySize, timeSlot, tenantId } = params;

  const booking = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.property.findUnique({
      where: { id: restaurantId },
      select: { seats: true, tenantId: true, kind: true },
    });

    if (!restaurant || restaurant.kind !== RESTAURANT_KIND) {
      throw new NotFoundException("Restaurant not found", ErrorCode.RESTAURANT_NOT_FOUND);
    }

    const resolvedTenantId = tenantId ?? restaurant.tenantId;

    if (tenantId != null && restaurant.tenantId !== tenantId) {
      throw new NotFoundException("Restaurant not found", ErrorCode.RESTAURANT_NOT_FOUND);
    }

    const seatAvailable = restaurant.seats!;
    const seatBooked = await tx.booking.aggregate({
      where: {
        propertyId: restaurantId,
        bookingDate,
        status: "CONFIRMED",
        timeSlot: {
          in: [timeSlot],
        },
      },
      _sum: {
        partySize: true,
      },
    });

    const totalBookedSeats = seatBooked._sum.partySize ?? 0;
    const requestedPartySize = partySize ?? 1;
    const isAvailable = totalBookedSeats + requestedPartySize <= seatAvailable;

    if (!isAvailable) {
      throw new BadRequestException(
        "Not enough seats available",
        ErrorCode.NOT_ENOUGH_SEATS
      );
    }

    return tx.booking.create({
      data: {
        userId: userId as number,
        tenantId: resolvedTenantId,
        propertyId: restaurantId,
        bookingDate,
        partySize,
        timeSlot,
        totalPrice: 100,
        status: "PENDING",
      },
    });
  });

  return new HTTPSuccessResponse("Table reserved successfully", 201, booking);
};

export const removeRestaurant = async (restaurantId: number, tenantId?: number | null) => {
  const restaurant = await prisma.property.findFirst({
    where: {
      id: restaurantId,
      ...buildPropertyWhere(RESTAURANT_KIND, tenantId),
    },
    include: { bookings: true },
  });

  if (!restaurant) {
    throw new NotFoundException("Restaurant not found", ErrorCode.RESTAURANT_NOT_FOUND);
  }

  await prisma.property.delete({
    where: { id: restaurantId },
  });

  return new HTTPSuccessResponse("Restaurant deleted successfully", 200, restaurant);
};

// Booking status updates are handled by the unified booking service.
