import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import { isPlatformAdmin } from "../utils/tenant-access";

export const requirePlatformAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return next(new UnauthorizedException("User not authenticated", ErrorCode.NO_AUTHORIZED));
  }

  if (!isPlatformAdmin(req.user)) {
    return next(new UnauthorizedException("Platform admin access required", ErrorCode.NO_AUTHORIZED));
  }

  return next();
};
