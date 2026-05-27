import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import { hasTenantRole } from "../utils/tenant-access";

export const requireTenantRole = (
  roles: Array<"OWNER" | "STAFF"> | "OWNER" | "STAFF"
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(
        new UnauthorizedException(
          "User not authenticated",
          ErrorCode.NO_AUTHORIZED
        )
      );
    }

    if (!hasTenantRole(req.user, roles)) {
      return next(
        new UnauthorizedException(
          "Tenant access required",
          ErrorCode.NO_AUTHORIZED
        )
      );
    }

    return next();
  };
};
