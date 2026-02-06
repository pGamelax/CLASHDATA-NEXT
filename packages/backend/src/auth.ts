import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { admin, openAPI, organization } from "better-auth/plugins";
import { env } from "./env";
import { prisma } from "./lib/prisma";

const trustedOrigins = Array.isArray(env.BETTER_AUTH_TRUSTED_ORIGIN)
  ? env.BETTER_AUTH_TRUSTED_ORIGIN
  : [env.BETTER_AUTH_TRUSTED_ORIGIN];

export const auth = betterAuth({
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
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
});

