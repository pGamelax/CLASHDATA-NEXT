import { Elysia, t } from "elysia";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user?.referralCode) return user.referralCode;

  // Gera código para usuários que já existiam antes do sistema
  let code: string;
  let attempts = 0;
  do {
    code = generateReferralCode();
    attempts++;
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) break;
  } while (attempts < 10);

  await prisma.user.update({ where: { id: userId }, data: { referralCode: code! } });
  return code!;
}

export const referralsRoutes = new Elysia({ prefix: "/referrals" })
  .get(
    "/my",
    async ({ request, error }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return error(401, { message: "Não autenticado" });

      const referralCode = await ensureReferralCode(session.user.id);

      const referrals = await prisma.user.findMany({
        where: { referredById: session.user.id },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      return {
        referralCode,
        referredCount: referrals.length,
        referrals,
      };
    },
    { detail: { tags: ["Referrals"], summary: "Meu código de indicação e indicados" } }
  )
  .post(
    "/apply",
    async ({ request, body, error }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return error(401, { message: "Não autenticado" });

      const { code } = body;

      // Verifica se o usuário já tem um indicador
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { referredById: true },
      });

      if (me?.referredById) {
        return error(400, { message: "Você já utilizou um código de indicação" });
      }

      // Busca o dono do código
      const referrer = await prisma.user.findUnique({
        where: { referralCode: code.toUpperCase() },
        select: { id: true },
      });

      if (!referrer) {
        return error(404, { message: "Código de indicação inválido" });
      }

      if (referrer.id === session.user.id) {
        return error(400, { message: "Você não pode usar seu próprio código" });
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { referredById: referrer.id },
      });

      return { success: true };
    },
    {
      body: t.Object({ code: t.String({ minLength: 1 }) }),
      detail: { tags: ["Referrals"], summary: "Aplicar código de indicação" },
    }
  );
