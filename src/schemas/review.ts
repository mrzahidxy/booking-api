import { z } from "zod";

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  propertyId: z.coerce.number().int().positive().optional(),
  hotelId: z.coerce.number().int().positive().optional(),
  restaurantId: z.coerce.number().int().positive().optional(),
});

export const reviewCreateSchema = z
  .object({
    propertyId: z.number().int().positive().optional(),
    hotelId: z.number().int().positive().optional(),
    restaurantId: z.number().int().positive().optional(),
    rating: z.number().int().min(1).max(5),
    review: z.string(),
  })
  .refine((value) => value.propertyId != null || value.hotelId != null || value.restaurantId != null, {
    message: "Review must target a property.",
    path: ["propertyId"],
  });

export const reviewUpdateSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    review: z.string().optional(),
  })
  .refine((value) => value.rating !== undefined || value.review !== undefined, {
    message: "At least one field must be provided.",
    path: ["rating"],
  });
