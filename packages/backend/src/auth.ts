import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { admin, openAPI, organization } from "better-auth/plugins";
import { Resend } from "resend";
import { env } from "./env";
import { prisma } from "./lib/prisma";

const resend = new Resend(env.RESEND_API_KEY);

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
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: env.RESEND_FROM,
        to: user.email,
        subject: "Redefinir sua senha — CLASHDATA",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f11;color:#e5e5e5;border-radius:12px;">
            <div style="margin-bottom:24px;">
              <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#fff;">CLASH<span style="color:#7c3aed;">DATA</span></span>
            </div>
            <h2 style="font-size:22px;font-weight:700;margin:0 0 12px;">Redefinição de senha</h2>
            <p style="color:#a1a1aa;margin:0 0 24px;line-height:1.6;">
              Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
            </p>
            <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;">
              Redefinir senha
            </a>
            <p style="color:#71717a;font-size:12px;margin:24px 0 0;line-height:1.6;">
              Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.
            </p>
          </div>
        `,
      });
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

