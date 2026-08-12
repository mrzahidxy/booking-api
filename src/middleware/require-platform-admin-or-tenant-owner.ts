import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import { hasTenantRole, isPlatformAdmin } from "../utils/tenant-access";

const readTenantIdFromRoute = (req: Request) => {
  const rawValue = req.params.tenantId ?? req.params.id;
  const tenantId = Number(rawValue);
  return Number.isInteger(tenantId) && tenantId > 0 ? tenantId : null;
};

export const requirePlatformAdminOrTenantOwner = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user?.id) {
    return next(
      new UnauthorizedException(
        "User not authenticated",
        ErrorCode.NO_AUTHORIZED
      )
    );
  }

  if (isPlatformAdmin(req.user)) {
    return next();
  }

  const tenantId = readTenantIdFromRoute(req);
  if (!tenantId) {
    return next(
      new UnauthorizedException(
        "Tenant access required",
        ErrorCode.NO_AUTHORIZED
      )
    );
  }

  const ownsTenant =
    req.user.tenantMembership?.tenantId === tenantId &&
    hasTenantRole(req.user, "OWNER");

  if (!ownsTenant) {
    return next(
      new UnauthorizedException(
        "Tenant owner access required",
        ErrorCode.NO_AUTHORIZED
      )
    );
  }

  return next();
};
