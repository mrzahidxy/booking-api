import dotenv from "dotenv";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  STRIPE_PAYMENT_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_PAYMENT_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, "STRIPE_WEBHOOK_SECRET is required"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  SERVER_URL: z.string().url().optional(),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

const loadEnv = () => {
  if (cachedEnv) return cachedEnv;
  dotenv.config({ path: ".env" });
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
};

const env = loadEnv();

export default env;
