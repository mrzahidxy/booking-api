import { z } from "zod";

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const CreateOwnerSchema = z.object({
  userId: z.number().int().positive(),
  tenantName: z.string().min(3),
  tenantSlug: z.string().min(3).optional(),
});
