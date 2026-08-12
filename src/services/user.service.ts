import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { HTTPSuccessResponse } from "../helpers/success-response";
import { formatPaginationResponse } from "../utils/common-method";
import prisma from "../utils/prisma";

export const fetchUsersService = async (params: { page?: number; limit?: number }) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    skip,
    take: limit,
  });

  const totalUsers = await prisma.user.count();

  if (!users || users.length === 0) {
    throw new NotFoundException("No users found", ErrorCode.USER_NOT_FOUND);
  }

  const formattedResponse = formatPaginationResponse(users, totalUsers, page, limit);

  return new HTTPSuccessResponse("Users fetched successfully", 200, formattedResponse);
};

export const fetchUserByIdService = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updateAt: true,
      bookings: true,
      review: true,
      notification: true,
    },
  });

  if (!user) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }

  return new HTTPSuccessResponse("User fetched successfully", 200, user);
};

export const updateUserService = async (params: { userId: number; data: Record<string, unknown> }) => {
  const { id: _ignoredId, ...safeData } = params.data;

  const user = await prisma.user.update({
    where: {
      id: params.userId,
    },
    data: safeData,
  });

  return new HTTPSuccessResponse("User updated successfully", 200, user);
};

export const saveFcmTokenService = async (params: { userId: number; fcmToken: string }) => {
  const saveFcmToken = await prisma.user.update({
    where: { id: params.userId },
    data: { fcmToken: params.fcmToken },
  });

  return new HTTPSuccessResponse("FCM token saved successfully", 200, saveFcmToken);
};
