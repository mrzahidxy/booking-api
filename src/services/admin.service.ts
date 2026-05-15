import prisma from "../utils/prisma";
import { HTTPSuccessResponse } from "../helpers/success-response";
import { formatPaginationResponse } from "../utils/common-method";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { BadRequestException } from "../exceptions/bad-request";
import { TenantMemberRole } from "@prisma/client";
import { buildTenantWhere } from "../utils/tenant-access";
import { resolveUniqueSlug } from "../utils/slug";

export const createAdminOwnerService = async (payload: {
  userId: number;
  tenantName: string;
  tenantSlug?: string;
}) => {
  const { userId, tenantName, tenantSlug } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      tenantMemberships: {
        select: {
          id: true,
        },
      },
    },
  });

  if (existingUser) {
    if (existingUser.tenantMemberships.length > 0) {
      throw new BadRequestException(
        "User already has a tenant",
        ErrorCode.BAD_REQUEST
      );
    }
  } else {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }

  const slugSource = tenantSlug?.trim() || tenantName;
  const slug = await resolveUniqueSlug(slugSource, async (candidate) => {
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    return Boolean(existingTenant);
  });

  const created = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug,
      },
    });

    const tenantMembership = await tx.tenantMember.create({
      data: {
        tenantId: tenant.id,
        userId,
        role: TenantMemberRole.OWNER,
      },
      include: {
        tenant: true,
      },
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        roleId: true,
        fcmToken: true,
        createdAt: true,
        updateAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
    }

    return { user, tenant, tenantMembership };
  });

  return new HTTPSuccessResponse("Owner created successfully", 201, {
    user: created.user,
    tenant: created.tenant,
    tenantMembership: created.tenantMembership,
  });
};

export const getAdminDashboardStatsService = async (tenantId?: number | null) => {
  const isTenantScoped = tenantId != null;
  const tenantWhere = buildTenantWhere(tenantId);
  const hotelWhere = isTenantScoped ? { ...tenantWhere, kind: "HOTEL" as const } : { kind: "HOTEL" as const };
  const restaurantWhere = isTenantScoped ? { ...tenantWhere, kind: "RESTAURANT" as const } : { kind: "RESTAURANT" as const };
  const roomWhere = isTenantScoped
    ? { property: { ...tenantWhere, kind: "HOTEL" as const } }
    : { property: { kind: "HOTEL" as const } };
  const notificationWhere = isTenantScoped
    ? { user: { tenantMemberships: { some: tenantWhere } } }
    : {};
  const reviewWhere = isTenantScoped
    ? {
        property: tenantWhere,
      }
    : {};

  const [
    totalTenants,
    activeTenants,
    totalUsers,
    totalHotels,
    totalRestaurants,
    totalRooms,
    totalBookings,
    totalReviews,
    totalNotifications,
    totalPayments,
    bookingStatusCounts,
    paymentStatusCounts,
    paymentTotals,
  ] = await prisma.$transaction([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    isTenantScoped
      ? prisma.user.count({
          where: {
            tenantMemberships: { some: tenantWhere },
          },
        })
      : prisma.user.count(),
    prisma.property.count({ where: hotelWhere }),
    prisma.property.count({ where: restaurantWhere }),
    prisma.room.count({ where: roomWhere }),
    prisma.booking.count({ where: tenantWhere }),
    prisma.review.count({ where: reviewWhere }),
    prisma.notification.count({ where: notificationWhere }),
    prisma.payment.count({ where: tenantWhere }),
    prisma.booking.groupBy({
      by: ["status"],
      where: tenantWhere,
      _count: true,
      orderBy: { status: "asc" },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: tenantWhere,
      _count: true,
      orderBy: { status: "asc" },
    }),
    prisma.payment.aggregate({
      where: tenantWhere,
      _sum: { amount: true },
    }),
  ]);

  const bookingsByStatus = bookingStatusCounts.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry.status] = (entry._count as number) ?? 0;
      return acc;
    },
    {}
  );

  const paymentsByStatus = paymentStatusCounts.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry.status] = (entry._count as number) ?? 0;
      return acc;
    },
    {}
  );

  return new HTTPSuccessResponse("Dashboard stats fetched successfully", 200, {
    totals: {
      tenants: isTenantScoped ? 0 : totalTenants,
      activeTenants: isTenantScoped ? 0 : activeTenants,
      users: totalUsers,
      hotels: totalHotels,
      restaurants: totalRestaurants,
      rooms: totalRooms,
      bookings: totalBookings,
      reviews: totalReviews,
      notifications: totalNotifications,
      payments: totalPayments,
    },
    bookingsByStatus,
    paymentsByStatus,
    revenue: paymentTotals._sum.amount ?? 0,
  });
};

export const getAdminTenantsService = async (params: { page?: number; limit?: number }) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;

  const [tenants, totalTenants] = await prisma.$transaction([
    prisma.tenant.findMany({
      skip,
      take: limit,
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    }),
    prisma.tenant.count(),
  ]);

  return new HTTPSuccessResponse(
    "Tenants fetched successfully",
    200,
    formatPaginationResponse(tenants, totalTenants, page, limit)
  );
};

export const getAdminTenantService = async (tenantId: number) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new NotFoundException("Tenant not found", ErrorCode.BAD_REQUEST);
  }

  return new HTTPSuccessResponse("Tenant fetched successfully", 200, tenant);
};

export const updateAdminTenantStatusService = async (tenantId: number, isActive: boolean) => {
  if (typeof isActive !== "boolean") {
    throw new BadRequestException("Tenant status must be boolean", ErrorCode.BAD_REQUEST);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new NotFoundException("Tenant not found", ErrorCode.BAD_REQUEST);
  }

  const updatedTenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { isActive },
  });

  return new HTTPSuccessResponse(
    `Tenant ${isActive ? "reactivated" : "suspended"} successfully`,
    200,
    updatedTenant
  );
};
