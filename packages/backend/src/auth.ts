import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { admin, openAPI, organization } from "better-auth/plugins";
import { env } from "./env";
import { prisma } from "./lib/prisma";

const trustedOrigins = Array.isArray(env.BETTER_AUTH_TRUSTED_ORIGIN)
  ? env.BETTER_AUTH_TRUSTED_ORIGIN
  : [env.BETTER_AUTH_TRUSTED_ORIGIN];

const socialProviders: Record<string, any> = {};

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    accessType: "offline",
    prompt: "select_account consent",
  };
}

if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) {
  socialProviders.discord = {
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
  };
}

if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: env.APPLE_CLIENT_ID,
    clientSecret: env.APPLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_BASE_URL,
  basePath: "/auth",
  plugins: [openAPI(), admin(), organization()],
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    usePlural: false,
  }),
  advanced: {
    useSecureCookies: true,
    database: {
      generateId: false,
    },
    crossSubDomainCookies: {
      enabled: true,
      domain: env.BETTER_AUTH_TRUSTED_DOMAIN,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: (password) => Bun.password.hash(password),
      verify: ({ password, hash }) => Bun.password.verify(password, hash),
    },
  },
  socialProviders,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
});

