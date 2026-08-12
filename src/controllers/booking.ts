import { Request, Response } from "express";
import { BookingStatus } from "@prisma/client";
import { roomBookingSchema } from "../schemas/hotels";
import {
  handleValidationError,
} from "../utils/common-method";
import { bookingStatusSchema } from "../schemas/booking";
import {
  createRoomBooking,
  fetchBookings,
  fetchUserBookings,
  updateBookingStatus,
} from "../services/booking.service";
import { resolveTenantId } from "../utils/tenant-access";

// Get User Bookings
export const getUserBookings = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const response = await fetchUserBookings({
    userId: req.user?.id,
    page,
    limit,
  });

  return res.status(response.statusCode).json(response);
};

// Get All Bookings
export const getBookings = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const tenantId = resolveTenantId(req);

  const response = await fetchBookings({ page, limit, tenantId });
  return res.status(response.statusCode).json(response);
};

// Update booking status
export const bookingStatusUpdate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const tenantId = resolveTenantId(req);

  // Validate request data
  const validationResult = bookingStatusSchema.safeParse({
    bookingId: id,
    status,
  });

  if (!validationResult.success) {
    return handleValidationError(res, validationResult);
  }

  const validStatus = validationResult.data.status as BookingStatus;

  const result = await updateBookingStatus({
    bookingId: +id,
    status: validStatus,
    tenantId,
  });

  // Send success response
  return res.status(result.statusCode).json(result.body);
};

// Book a Room
export const bookRoom = async (req: Request, res: Response) => {
  // Validate request data
  const validateResult = roomBookingSchema.safeParse({
    ...req.body,
    userId: req.user?.id,
  });

  if (!validateResult.success) {
    return handleValidationError(res, validateResult);
  }

  const { userId, roomId, bookingDate, quantity } = validateResult.data!;

  const response = await createRoomBooking({
    userId,
    roomId,
    bookingDate: new Date(bookingDate),
    quantity,
  });

  res.status(response.statusCode).json(response);
};
