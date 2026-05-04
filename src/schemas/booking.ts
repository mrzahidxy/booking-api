import { z } from "zod";

export const reservationSchema = z.object({
  restaurantId: z
    .number()
    .int()
    .positive()
    .refine((value) => value > 0, {
      message: "restaurantId is required and must be a positive integer",
    }),
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
});

export const bookingStatusSchema = z.object({
  bookingId: z.string().refine((id) => !isNaN(Number(id)) && Number(id) > 0, {
    message: "bookingId must be a positive integer",
  }),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});
