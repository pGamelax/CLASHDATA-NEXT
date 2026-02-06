import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string(),
  
  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_BASE_URL: z.string().url().optional(),
  BETTER_AUTH_TRUSTED_ORIGIN: z.string().url().or(z.string().url().array()),
  BETTER_AUTH_TRUSTED_DOMAIN: z.string().optional(),
  
  // Server
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // CORS
  CORS_ORIGIN: z.string().url().or(z.string().url().array()).optional(),
  
  // Clash of Clans API
  TOKEN_COC: z.string(),
  
  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv() {
  const parsed = envSchema.safeParse(Bun.env);
  
  if (!parsed.success) {
    console.error("❌ Variáveis de ambiente inválidas:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }
  
  return parsed.data;
}

export const env = parseEnv();

