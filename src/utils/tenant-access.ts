import { Request } from "express";
import { ErrorCode } from "../exceptions/root";
import { UnauthorizedException } from "../exceptions/unauthorized";

type TenantSummary = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
};

export type TenantMembership = {
  tenantId: number;
  role: "OWNER" | "STAFF";
  tenant?: TenantSummary;
};

type TenantMembershipRecord = {
  tenantId: number;
  role: "OWNER" | "STAFF";
  tenant?: TenantSummary | null;
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

const readTenantId = (value: unknown) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

export const isPlatformAdmin = (user?: TenantAwareUser | null) => {
  return user?.role?.name === "ADMIN";
};

export const buildTenantMembership = (membership?: TenantMembershipRecord | null) => {
  if (!membership) return undefined;

  const { tenant, ...rest } = membership;
  return {
    ...rest,
    tenant: tenant ?? undefined,
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
  return (
    readTenantId(req.headers["x-tenant-id"]) ??
    readTenantId(req.query.tenantId) ??
    readTenantId((req.body as { tenantId?: unknown } | undefined)?.tenantId)
  );
};

export const buildTenantWhere = (tenantId?: number | null) => {
  return tenantId == null ? {} : { tenantId };
};

export const resolveTenantId = (
  req: Request,
  options: ResolveTenantOptions = {}
) => {
  const requestedTenantId = getRequestedTenantId(req);
  const user = req.user;

  if (!user?.id) {
    if (options.requireTenant && !requestedTenantId) {
      return null;
    }

    return requestedTenantId ?? undefined;
  }

  if (isPlatformAdmin(user)) {
    return requestedTenantId ?? (options.requireTenant ? null : undefined);
  }

  const primaryTenantId = getPrimaryTenantId(user);

  if (!primaryTenantId) {
    throw new UnauthorizedException("Tenant access required", ErrorCode.NO_AUTHORIZED);
  }

  if (requestedTenantId && requestedTenantId !== primaryTenantId) {
    throw new UnauthorizedException("Tenant access required", ErrorCode.NO_AUTHORIZED);
  }

  return primaryTenantId;
};

export const canManageTenantData = (user?: TenantAwareUser | null) => {
  return isPlatformAdmin(user) || getPrimaryTenantId(user) !== null;
};

export const hasTenantRole = (
  user: TenantAwareUser | null | undefined,
  roles: Array<TenantMembership["role"]> | TenantMembership["role"]
) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return Boolean(
    user?.tenantMembership &&
      allowedRoles.includes(user.tenantMembership.role)
  );
};
