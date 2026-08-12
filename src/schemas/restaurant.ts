import { z } from "zod";

const menuItemSchema = z.object({
  name: z.string(),
  price: z.number(),
});

const menuSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, z.array(menuItemSchema));

// ✅ Restaurant Schema
export const restaurantSchema = z.object({
  name: z.string().min(3, "Restaurant name must be at least 3 characters long"),
  location: z.string().min(3, "Location must be at least 3 characters long"),
  description: z.string().optional(),
  cuisine: z.array(z.string()).optional(),
  seats: z.number().optional(),
  menu: menuSchema.optional(),
  image: z.array(z.string()).optional(),
});
