import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import { hasTenantRole, isPlatformAdmin } from "../utils/tenant-access";

export const requireWorkspaceManager = (
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

  if (isPlatformAdmin(req.user) || hasTenantRole(req.user, "OWNER")) {
    return next();
  }

  return next(
    new UnauthorizedException(
      "Workspace manager access required",
      ErrorCode.NO_AUTHORIZED
    )
  );
};
