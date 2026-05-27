import { Prisma } from "@prisma/client";
import { BadRequestException } from "../exceptions/bad-request";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { HTTPSuccessResponse } from "../helpers/success-response";
import prisma from "../utils/prisma";

const reviewUserSelect = {
  id: true,
  name: true,
} as const;

const syncPropertyRatings = async (tx: Prisma.TransactionClient, propertyId: number) => {
  const ratingsSummary = await tx.review.aggregate({
    where: { propertyId },
    _avg: { rating: true },
  });

  await tx.property.update({
    where: { id: propertyId },
    data: {
      ratings: ratingsSummary._avg.rating ?? 0,
    },
  });
};

export const getReviewsService = async (params: {
  page?: number;
  limit?: number;
  propertyId?: number;
  hotelId?: number;
  restaurantId?: number;
}) => {
  const pageNum = params.page ?? 1;
  const limitNum = params.limit ?? 10;

  const whereClause: Record<string, any> = {};
  const propertyId = params.propertyId ?? params.hotelId ?? params.restaurantId;
  if (propertyId) whereClause.propertyId = propertyId;

  const reviews = await prisma.review.findMany({
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: reviewUserSelect,
      },
    },
  });

  const total = await prisma.review.count({
    where: whereClause,
  });

  return new HTTPSuccessResponse("Reviews fetched successfully", 200, {
    page: pageNum,
    limit: limitNum,
    total,
    data: reviews,
  });
};

export const createReviewService = async (payload: {
  userId: number;
  propertyId?: number | null;
  hotelId?: number | null;
  restaurantId?: number | null;
  rating: number;
  review: string;
}) => {
  const { userId, propertyId, hotelId, restaurantId, rating, review } = payload;
  const resolvedPropertyId = propertyId ?? hotelId ?? restaurantId;

  if (!resolvedPropertyId) {
    throw new BadRequestException(
      "Review must target a property",
      ErrorCode.BAD_REQUEST
    );
  }

  const property = await prisma.property.findUnique({
    where: { id: resolvedPropertyId },
    select: { id: true },
  });

  if (!property) {
    throw new NotFoundException("Property not found", ErrorCode.BAD_REQUEST);
  }

  const newReview = await prisma.$transaction(async (tx) => {
    const createdReview = await tx.review.create({
      data: {
        userId,
        propertyId: resolvedPropertyId,
        rating,
        review,
      },
    });

    await syncPropertyRatings(tx, resolvedPropertyId);

    return createdReview;
  });

  return new HTTPSuccessResponse("Review created successfully", 201, newReview);
};

export const updateReviewService = async (payload: {
  reviewId: number;
  userId: number;
  rating?: number;
  review?: string;
}) => {
  const existingReview = await prisma.review.findUnique({
    where: { id: payload.reviewId },
  });

  if (!existingReview) {
    throw new NotFoundException("Review not found", ErrorCode.REVIEW_NOT_FOUND);
  }

  if (existingReview.userId !== payload.userId) {
    throw new UnauthorizedException("You cannot update this review", ErrorCode.NO_AUTHORIZED);
  }

  const updatedReview = await prisma.$transaction(async (tx) => {
    const reviewRecord = await tx.review.update({
      where: { id: payload.reviewId },
      data: { rating: payload.rating, review: payload.review },
    });

    await syncPropertyRatings(tx, existingReview.propertyId);

    return reviewRecord;
  });

  return new HTTPSuccessResponse("Review updated successfully", 200, updatedReview);
};

export const deleteReviewService = async (reviewId: number, userId: number) => {
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new NotFoundException("Review not found", ErrorCode.REVIEW_NOT_FOUND);
  }

  if (existingReview.userId !== userId) {
    throw new UnauthorizedException("You cannot delete this review", ErrorCode.NO_AUTHORIZED);
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({
      where: { id: reviewId },
    });

    await syncPropertyRatings(tx, existingReview.propertyId);
  });

  return new HTTPSuccessResponse("Review deleted successfully", 200);
};
