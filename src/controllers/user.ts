import { Request, Response } from "express";
import {
  fetchUserByIdService,
  fetchUsersService,
  saveFcmTokenService,
  updateUserService,
} from "../services/user.service";
import { HTTPSuccessResponse } from "../helpers/success-response";
import { NotFoundException } from "../exceptions/not-found";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";

export const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const response = await fetchUsersService({ page, limit });

  return res.status(response.statusCode).json(response);
}


export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const response = await fetchUserByIdService(+id);

  res.status(response.statusCode).json(response);
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new UnauthorizedException("User not authenticated", ErrorCode.NO_AUTHORIZED);
  }

  const response = await fetchUserByIdService(userId);

  res.status(response.statusCode).json(response);
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new UnauthorizedException("User not authenticated", ErrorCode.NO_AUTHORIZED);
  }

  const response = await updateUserService({ userId, data: req.body });

  res.status(response.statusCode).json(response);
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const response = await updateUserService({ userId: +id, data: req.body });

  res.status(response.statusCode).json(response);
};

// save fcm token for user notification
export const saveFcmToken = async (req: Request, res: Response) => {
  const userId = Number(req.user?.id);
  const { fcmToken } = req.body;

  // ✅ Basic validation
  if (!userId || !fcmToken) {
    const error = new NotFoundException("User ID and FCM token are required", 400);
    return res.status(error.statusCode).json(error);
  }

  const response = await saveFcmTokenService({ userId, fcmToken });
  return res.status(response.statusCode).json(response);
}
