import { compareSync, hashSync } from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
import { BadRequestException } from "../exceptions/bad-request";
import { ErrorCode } from "../exceptions/root";
import { NotFoundException } from "../exceptions/not-found";
import { HTTPSuccessResponse } from "../helpers/success-response";
import env from "../utils/env";
import { buildTenantMembership } from "../utils/tenant-access";

export const signupUser = async (payload: {
  email: string;
  password: string;
  name: string;
}) => {
  const { email, password, name } = payload;

  let user = await prisma.user.findFirst({
    where: { email },
  });

  if (user) {
    throw new BadRequestException(
      "User already exists",
      ErrorCode.USER_ALREADY_EXISTS
    );
  }

  const userRoleId = await prisma.role.findUnique({
    where: { name: "USER" },
  });

  user = await prisma.user.create({
    data: {
      email,
      password: hashSync(password, 10),
      name,
      roleId: userRoleId?.id,
    },
  });

  const { password: userPassword, ...rest } = user;

  return new HTTPSuccessResponse("Signup successfully", 201, rest);
};

export const loginUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      password: true,
      role: {
        select: {
          name: true,
        },
      },
      tenantMemberships: {
        orderBy: [
          {
            tenant: {
              isActive: "desc",
            },
          },
          {
            createdAt: "asc",
          },
        ],
        take: 1,
        select: {
          tenantId: true,
          role: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException("No user found", ErrorCode.USER_NOT_FOUND);
  }

  if (!compareSync(password, user.password)) {
    throw new BadRequestException("Wrong password", ErrorCode.INCORRECT_PASSWORD);
  }

  const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: "1d" });

  const tenantMembership = buildTenantMembership(user.tenantMemberships[0]);

  const { password: userPassword, role, tenantMemberships: _tenantMemberships, ...rest } = user;

  return new HTTPSuccessResponse("Login successfully", 201, {
    ...rest,
    role: role?.name,
    tenantMembership,
    token,
  });
};
