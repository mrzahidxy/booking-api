import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import env from "../utils/env";
import prisma from "../utils/prisma";
import { buildTenantMembership } from "../utils/tenant-access";

const loadAuthenticatedUser = async (token: string) => {
  const payload = jwt.verify(token, env.JWT_SECRET) as { id: number };

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      role: {
        include: {
          rolePermission: {
            include: { permission: true },
          },
        },
      },
      tenantMemberships: {
        take: 1,
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedException("Invalid token", ErrorCode.NO_TOKEN_PROVIDED);
  }

  const permissions = user.role?.rolePermission?.map((rp) => rp.permission.name) ?? [];
  const { tenantMemberships: _tenantMemberships, ...baseUser } = user;

  return {
    user: {
      ...baseUser,
      role: user.role ?? undefined,
      tenantMembership: buildTenantMembership(user.tenantMemberships[0]),
    },
    permissions,
  };
};

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new UnauthorizedException(
        "No token provided",
        ErrorCode.NO_TOKEN_PROVIDED
      )
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const { user, permissions } = await loadAuthenticatedUser(token);
    req.userPermissions = new Set(permissions);
    req.user = user;

    return next();
  } catch (_error) {
    console.error("Authentication error:", _error);
    return next(
      new UnauthorizedException(
        "Invalid token",
        ErrorCode.NO_TOKEN_PROVIDED
      )
    );
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const { user, permissions } = await loadAuthenticatedUser(token);
    req.userPermissions = new Set(permissions);
    req.user = user;
    return next();
  } catch (_error) {
    console.error("Authentication error:", _error);
    return next(
      new UnauthorizedException(
        "Invalid token",
        ErrorCode.NO_TOKEN_PROVIDED
      )
    );
  }
};
