import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required. Set it in .env and .env.local."),
  GOOGLE_MAPS_API_KEY_PUBLIC: z.string().optional().default(""),
  GOOGLE_MAPS_API_KEY_SERVER: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),
  NEXTAUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  GOOGLE_MAPS_API_KEY_PUBLIC: process.env.GOOGLE_MAPS_API_KEY_PUBLIC,
  GOOGLE_MAPS_API_KEY_SERVER: process.env.GOOGLE_MAPS_API_KEY_SERVER,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
});
