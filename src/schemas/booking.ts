import { z } from "zod";

export const reservationSchema = z.object({
  propertyId: z.number().int().positive().optional(),
  restaurantId: z.number().int().positive().optional(),
  bookingDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "bookingDate is required and must be a valid date",
  }),
  timeSlot: z
    .enum(["MORNING", "NOON", "AFTERNOON", "EVENING", "NIGHT"])
    .refine((val) => val.length > 0, {
      message: "timeSlot must be one of 'noon', 'evening', or 'late night'.",
    }),
  partySize: z
    .number()
    .int()
    .positive()
    .refine((value) => value > 0, {
      message: "partySize is required and must be a positive integer",
    }),
}).refine((value) => value.propertyId != null || value.restaurantId != null, {
  message: "propertyId is required and must be a positive integer",
  path: ["propertyId"],
});

export const bookingStatusSchema = z.object({
  bookingId: z.string().refine((id) => !isNaN(Number(id)) && Number(id) > 0, {
    message: "bookingId must be a positive integer",
  }),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});
