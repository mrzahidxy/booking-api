import { Request } from "express";
import { ErrorCode } from "../exceptions/root";
import { UnauthorizedException } from "../exceptions/unauthorized";

export type TenantMembership = {
  tenantId: number;
  role: "OWNER" | "STAFF";
  tenant?: {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
  };
};

type TenantMembershipRecord = {
  tenantId: number;
  role: "OWNER" | "STAFF";
  tenant?: {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
  } | null;
};

type TenantAwareUser = {
  role?: {
    name: string;
  };
  tenantMembership?: TenantMembership;
};

type ResolveTenantOptions = {
  requireTenant?: boolean;
};

export const isPlatformAdmin = (user?: TenantAwareUser | null) => {
  return user?.role?.name === "ADMIN";
};

export const buildTenantMembership = (membership?: TenantMembershipRecord | null) => {
  if (!membership) {
    return undefined;
  }

  return {
    tenantId: membership.tenantId,
    role: membership.role,
    tenant: membership.tenant
      ? {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
          isActive: membership.tenant.isActive,
        }
      : undefined,
  };
};

export const getPrimaryTenantId = (user?: TenantAwareUser | null) => {
  if (!user || isPlatformAdmin(user)) {
    return null;
  }

  return user.tenantMembership?.tenant?.isActive === false
    ? null
    : user.tenantMembership?.tenantId ?? null;
};

export const getRequestedTenantId = (req: Request) => {
  const headerValue = req.headers["x-tenant-id"];
  const rawValue = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const parsedHeader = rawValue ? Number(rawValue) : NaN;

  if (Number.isInteger(parsedHeader) && parsedHeader > 0) {
    return parsedHeader;
  }

  const queryValue = req.query.tenantId;
  const rawQuery = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const parsedQuery = rawQuery ? Number(rawQuery) : NaN;

  if (Number.isInteger(parsedQuery) && parsedQuery > 0) {
    return parsedQuery;
  }

  const bodyTenantId = (req.body as { tenantId?: unknown } | undefined)?.tenantId;
  const parsedBody = Number(bodyTenantId);

  if (Number.isInteger(parsedBody) && parsedBody > 0) {
    return parsedBody;
  }

  return null;
};

export const resolveTenantId = (
  req: Request,
  options: ResolveTenantOptions = {}
) => {
  const requestedTenantId = getRequestedTenantId(req);
  const user = req.user;
  const primaryTenantId = getPrimaryTenantId(user);

  if (!user?.id) {
    if (options.requireTenant && !requestedTenantId) {
      return null;
    }

    return requestedTenantId ?? undefined;
  }

  if (isPlatformAdmin(user)) {
    if (options.requireTenant) {
      return requestedTenantId ?? null;
    }

    return requestedTenantId ?? undefined;
  }

  if (!primaryTenantId) {
    throw new UnauthorizedException("Tenant access required", ErrorCode.NO_AUTHORIZED);
  }

  if (requestedTenantId && requestedTenantId !== primaryTenantId) {
    throw new UnauthorizedException("Tenant access required", ErrorCode.NO_AUTHORIZED);
  }

  return primaryTenantId;
};

export const canManageTenantData = (user?: TenantAwareUser | null) => {
  return isPlatformAdmin(user) || Boolean(getPrimaryTenantId(user));
};
