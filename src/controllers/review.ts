import { Request, Response } from "express";
import {
  createReviewService,
  deleteReviewService,
  getReviewsService,
  updateReviewService,
} from "../services/review.service";
import { reviewCreateSchema, reviewQuerySchema, reviewUpdateSchema } from "../schemas/review";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import { handleValidationError } from "../utils/common-method";

export const getReviews = async (req: Request, res: Response) => {
  const validation = reviewQuerySchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({ message: "Invalid review query" });
  }

  const { page, limit, propertyId, hotelId, restaurantId } = validation.data;
  const resolvedPropertyId = propertyId ?? hotelId ?? restaurantId;

  const response = await getReviewsService({
    page,
    limit,
    propertyId: resolvedPropertyId ? Number(resolvedPropertyId) : undefined,
  });
  res.status(response.statusCode).json(response);
};

export const createReview = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new UnauthorizedException("User not authenticated", ErrorCode.NO_AUTHORIZED);
  }

  const validation = reviewCreateSchema.safeParse(req.body);
  if (!validation.success) {
    return handleValidationError(res, validation);
  }

  const { propertyId, hotelId, restaurantId, rating, review } = validation.data;
  const resolvedPropertyId = propertyId ?? hotelId ?? restaurantId;

  if (!resolvedPropertyId) {
    return res.status(400).json({ message: "Review must target a property." });
  }

  const response = await createReviewService({
    userId: req.user.id,
    propertyId: resolvedPropertyId,
    rating,
    review,
  });

  res.status(response.statusCode).json(response);
};

export const updateReview = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new UnauthorizedException("User not authenticated", ErrorCode.NO_AUTHORIZED);
  }

  const reviewId = +req.params.id;
  const validation = reviewUpdateSchema.safeParse(req.body);

  if (!validation.success) {
    return handleValidationError(res, validation);
  }

  const { rating, review } = validation.data;

  const response = await updateReviewService({
    reviewId,
    userId: req.user.id,
    rating,
    review,
  });

  res.status(response.statusCode).json(response);
};

export const deleteReview = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new UnauthorizedException("User not authenticated", ErrorCode.NO_AUTHORIZED);
  }

  const reviewId = +req.params.id;

  const response = await deleteReviewService(reviewId, req.user.id);

  res.status(response.statusCode).json(response);
};
