import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import { canManageTenantData } from "../utils/tenant-access";

export const requireTenantManagement = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user?.id) {
    return next(
      new UnauthorizedException("User not authenticated", ErrorCode.NO_TOKEN_PROVIDED)
    );
  }

  if (!canManageTenantData(req.user)) {
    return next(
      new UnauthorizedException("Tenant access required", ErrorCode.NO_TOKEN_PROVIDED)
    );
  }

  return next();
};
