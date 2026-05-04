import { RoomType } from "@prisma/client";
import { z } from "zod";

export const roomSchema = z.object({
  id: z.number().optional(),
  roomType: z.nativeEnum(RoomType, { required_error: "Room type is required" }),
  price: z.number().positive("Price must be a positive number"),
  image: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  quantity: z.number().optional(),
});

export const hotelSchema = z.object({
  name: z.string().min(3, "Hotel name must be at least 3 characters long"),
  location: z.string().min(3, "Location must be at least 3 characters long"),
  image: z.array(z.string()).optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  rooms: z.array(roomSchema).optional(),
});

export const roomBookingSchema = z.object({
  roomId: z.number().min(1, { message: "Room ID is required" }),
  userId: z.number().min(1, { message: "User ID is required" }),
  bookingDate: z.string().min(1, { message: "Booking date is required" }),
  quantity: z.number().min(1, { message: "Quantity is required" }),
});

export { RoomType };
