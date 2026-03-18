import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string(),
  
  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_BASE_URL: z.string().url(),
  BETTER_AUTH_TRUSTED_ORIGIN: z.string().url().or(z.string().url().array()),
  BETTER_AUTH_TRUSTED_DOMAIN: z.string(),
  
  // Server
  PORT: z.string().default("3003"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // CORS
  CORS_ORIGIN: z.string().url().or(z.string().url().array()),
  
  // Clash of Clans API
  TOKEN_COC: z.string(),
  
  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),
  
  // SyncPay PIX
  SYNCPAY_CLIENT_ID: z.string(),
  SYNCPAY_CLIENT_SECRET: z.string(),
  SYNCPAY_WEBHOOK_TOKEN: z.string().optional(),
  SYNCPAY_WEBHOOK_URL: z.string().url().optional(),

  // Social Auth - Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Social Auth - Discord
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),

  // Social Auth - Apple
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),

  // Resend (email)
  RESEND_API_KEY: z.string(),
  RESEND_FROM: z.string().default("CLASHDATA <noreply@clashdata.com.br>"),
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

