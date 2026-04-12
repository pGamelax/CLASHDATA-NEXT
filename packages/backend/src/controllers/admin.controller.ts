import { auth } from "../auth";
import { prisma } from "../lib/prisma";
import { SubscriptionStatus } from "../generated/prisma";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

function isAdmin(session: any) {
  return session?.user?.role === "admin";
}

export class AdminController {
  async getDashboardStats(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        usersThisMonth,
        totalClans,
        clansThisMonth,
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        subscriptionsByPlan,
        clansWithoutSubscription,
        usersLast7Days,
        recentUsers,
        expiringSoonList,
        recentClans,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.clan.count(),
        prisma.clan.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
        prisma.subscription.count({ where: { status: SubscriptionStatus.TRIAL } }),
        prisma.subscription.count({ where: { status: SubscriptionStatus.EXPIRED } }),
        prisma.subscription.count({ where: { status: SubscriptionStatus.CANCELLED } }),
        prisma.subscription.groupBy({ by: ["plan"], _count: { plan: true } }),
        prisma.clan.count({ where: { subscription: null } }),
        prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, name: true, email: true, role: true, banned: true, createdAt: true },
        }),
        prisma.subscription.findMany({
          where: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { lte: new Date(Date.now() + 7 * 86400000), gte: now },
          },
          include: { clan: { select: { id: true, name: true, tag: true } } },
          orderBy: { currentPeriodEnd: "asc" },
        }),
        prisma.clan.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            owner: { select: { id: true, name: true, email: true } },
            subscription: { select: { plan: true, status: true } },
          },
        }),
      ]);

      return {
        success: true,
        stats: {
          users: {
            total: totalUsers,
            thisMonth: usersThisMonth,
            last7Days: usersLast7Days,
            recent: recentUsers,
          },
          clans: {
            total: totalClans,
            thisMonth: clansThisMonth,
            withoutSubscription: clansWithoutSubscription,
            recent: recentClans.map((c) => ({
              id: c.id,
              name: c.name,
              tag: c.tag,
              createdAt: c.createdAt,
              owner: c.owner,
              subscription: c.subscription ? { plan: c.subscription.plan, status: c.subscription.status } : null,
            })),
          },
          subscriptions: {
            total: totalSubscriptions,
            active: activeSubscriptions,
            trial: trialSubscriptions,
            expired: expiredSubscriptions,
            cancelled: cancelledSubscriptions,
            byPlan: subscriptionsByPlan.map((item) => ({ plan: item.plan, count: item._count.plan })),
            expiringSoon: expiringSoonList.map((s) => ({
              id: s.id,
              plan: s.plan,
              currentPeriodEnd: s.currentPeriodEnd,
              clan: s.clan,
            })),
          },
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar estatísticas do admin:", error);
      return status(500, { message });
    }
  }

  async getSubscriptions(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const subscriptions = await prisma.subscription.findMany({
        include: {
          clan: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: subscriptions };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar subscriptions:", error);
      return status(500, { message });
    }
  }

  async getUsers(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const users = await prisma.user.findMany({
        include: {
          ownedClans: {
            include: { subscription: { select: { plan: true, status: true } } },
          },
          _count: { select: { ownedClans: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: users };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar usuários:", error);
      return status(500, { message });
    }
  }

  async getClans(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const clans = await prisma.clan.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          subscription: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: clans };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar clans:", error);
      return status(500, { message });
    }
  }

  async cancelClanSubscription(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const { clanId } = params as { clanId: string };

      const subscription = await prisma.subscription.findUnique({ where: { clanId } });
      if (!subscription) return status(404, { message: "Subscription não encontrada" });

      const { SubscriptionRepository } = await import("../repositories/subscription.repository");
      const subscriptionRepository = new SubscriptionRepository();
      await subscriptionRepository.cancel(clanId);

      return { success: true, message: "Assinatura cancelada com sucesso" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao cancelar assinatura:", error);
      return status(500, { message });
    }
  }

  async deleteUser(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const { userId } = params as { userId: string };
      if (userId === session.user.id)
        return status(400, { message: "Você não pode excluir sua própria conta" });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return status(404, { message: "Usuário não encontrado" });

      await prisma.user.delete({ where: { id: userId } });

      return { success: true, message: "Usuário excluído com sucesso" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao excluir usuário:", error);
      return status(500, { message });
    }
  }

  async updateUser(context: ElysiaContext) {
    const { params, body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const { userId } = params as { userId: string };
      const updateData = body as { name?: string; email?: string; role?: string; banned?: boolean };

      const existingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!existingUser) return status(404, { message: "Usuário não encontrado" });

      if (updateData.role && !["user", "admin"].includes(updateData.role))
        return status(400, { message: "Role inválido. Deve ser 'user' ou 'admin'" });

      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({ where: { email: updateData.email } });
        if (emailExists) return status(409, { message: "Email já está em uso" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(updateData.name !== undefined && { name: updateData.name }),
          ...(updateData.email !== undefined && { email: updateData.email }),
          ...(updateData.role !== undefined && { role: updateData.role }),
          ...(updateData.banned !== undefined && { banned: updateData.banned }),
        },
      });

      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao atualizar usuário:", error);
      return status(500, { message });
    }
  }

  async deleteClan(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const { clanId } = params as { clanId: string };

      const clan = await prisma.clan.findUnique({ where: { id: clanId } });
      if (!clan) return status(404, { message: "Clan não encontrado" });

      await prisma.clan.delete({ where: { id: clanId } });

      return { success: true, message: "Clan excluído com sucesso" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao excluir clan:", error);
      return status(500, { message });
    }
  }

  async createClanWithManualSubscription(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const { ownerEmail, clanTag, plan, daysUntilExpiry } = body as {
        ownerEmail: string;
        clanTag: string;
        plan: string;
        daysUntilExpiry: number;
      };

      if (!ownerEmail || !clanTag || !plan || !daysUntilExpiry)
        return status(400, { message: "Todos os campos são obrigatórios" });

      if (daysUntilExpiry <= 0)
        return status(400, { message: "Dias até expiração deve ser maior que zero" });

      const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
      if (!owner) return status(404, { message: "Usuário com esse email não encontrado" });

      const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

      const existingClan = await prisma.clan.findFirst({ where: { tag: normalizedTag } });
      if (existingClan) return status(409, { message: "Já existe um clan com essa tag" });

      const { ClashOfClansService } = await import("../services/clash-of-clans.service");
      const cocService = new ClashOfClansService();
      const clanData = await cocService.searchClanByTag(normalizedTag);

      const clan = await prisma.clan.create({
        data: {
          tag: normalizedTag,
          name: clanData.name,
          ownerId: owner.id,
          description: clanData.description,
          badgeUrls: clanData.badgeUrls ?? {},
          clanLevel: clanData.clanLevel ?? 0,
          clanPoints: clanData.clanPoints ?? 0,
          members: clanData.members ?? 0,
        },
      });

      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + daysUntilExpiry);

      const subscription = await prisma.subscription.create({
        data: {
          clanId: clan.id,
          plan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd,
          paymentProvider: "manual",
        },
        include: { clan: true },
      });

      const { scheduleSubscriptionExpiryCheck } = await import("../jobs/subscription-expiry.job");
      await scheduleSubscriptionExpiryCheck(clan.id, currentPeriodEnd);

      return { success: true, clan, subscription };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao criar clan com assinatura manual:", error);
      if (message.includes("já existe") || message.includes("já está em uso"))
        return status(409, { message });
      return status(500, { message });
    }
  }

  async reactivateSubscription(context: ElysiaContext) {
    const { params, body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const { clanId } = params as { clanId: string };
      const { daysUntilExpiry } = body as { daysUntilExpiry: number };

      if (!daysUntilExpiry || daysUntilExpiry <= 0)
        return status(400, { message: "Dias até expiração deve ser maior que zero" });

      const subscription = await prisma.subscription.findUnique({ where: { clanId } });
      if (!subscription) return status(404, { message: "Subscription não encontrada" });

      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + daysUntilExpiry);

      const updatedSubscription = await prisma.subscription.update({
        where: { clanId },
        data: { status: SubscriptionStatus.ACTIVE, currentPeriodEnd, cancelAtPeriodEnd: false },
        include: { clan: true },
      });

      const { scheduleSubscriptionExpiryCheck } = await import("../jobs/subscription-expiry.job");
      await scheduleSubscriptionExpiryCheck(clanId, currentPeriodEnd);

      return { success: true, subscription: updatedSubscription, message: "Assinatura reativada com sucesso" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao reativar assinatura:", error);
      return status(500, { message });
    }
  }

  async getBillingStats(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      const [
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        thisYearRevenue,
        recentPayments,
        paymentsByStatus,
        revenueByPlan,
        revenueByPeriod,
        last12MonthsPayments,
        activeSubscriptions,
        plans,
      ] = await Promise.all([
        prisma.pixPayment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
        prisma.pixPayment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfMonth } }, _sum: { amount: true }, _count: true }),
        prisma.pixPayment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true }, _count: true }),
        prisma.pixPayment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfYear } }, _sum: { amount: true }, _count: true }),
        prisma.pixPayment.findMany({
          where: { status: "PAID" },
          orderBy: { paidAt: "desc" },
          take: 10,
          include: {
            subscription: {
              include: { clan: { select: { id: true, name: true, tag: true } } },
            },
          },
        }),
        prisma.pixPayment.groupBy({ by: ["status"], _sum: { amount: true }, _count: true }),
        prisma.pixPayment.groupBy({ by: ["plan"], where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
        prisma.pixPayment.groupBy({ by: ["period"], where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
        prisma.pixPayment.findMany({ where: { status: "PAID", paidAt: { gte: twelveMonthsAgo } }, select: { amount: true, paidAt: true }, orderBy: { paidAt: "asc" } }),
        prisma.subscription.findMany({ where: { status: SubscriptionStatus.ACTIVE }, select: { plan: true, period: true } }),
        prisma.plan.findMany({ select: { key: true, monthlyPrice: true, quarterlyPrice: true, yearlyPrice: true } }),
      ]);

      const monthlyMap = new Map<string, { amount: number; count: number }>();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap.set(key, { amount: 0, count: 0 });
      }
      for (const payment of last12MonthsPayments) {
        if (!payment.paidAt) continue;
        const d = new Date(payment.paidAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = monthlyMap.get(key);
        if (entry) { entry.amount += payment.amount; entry.count += 1; }
      }
      const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, val]) => ({ month, amount: val.amount, count: val.count }));

      const FALLBACK_PRICES: Record<string, { monthlyPrice: number; quarterlyPrice: number; yearlyPrice: number }> = {
        MESTRE:  { monthlyPrice: 2990,  quarterlyPrice: 8073,  yearlyPrice: 28704  },
        CAMPEAO: { monthlyPrice: 4590,  quarterlyPrice: 12393, yearlyPrice: 44064  },
        TITA:    { monthlyPrice: 7490,  quarterlyPrice: 20223, yearlyPrice: 71904  },
        LEGEND:  { monthlyPrice: 11990, quarterlyPrice: 32373, yearlyPrice: 115104 },
      };
      const planPriceMap = new Map(plans.map((p) => [p.key, p]));

      let mrr = 0;
      for (const sub of activeSubscriptions) {
        const prices = planPriceMap.get(sub.plan) ?? FALLBACK_PRICES[sub.plan];
        if (!prices) continue;
        const period = sub.period ?? "monthly";
        if (period === "monthly") mrr += prices.monthlyPrice;
        else if (period === "quarterly") mrr += Math.round(prices.quarterlyPrice / 3);
        else if (period === "yearly") mrr += Math.round(prices.yearlyPrice / 12);
      }

      return {
        success: true,
        billing: {
          revenue: {
            total: totalRevenue._sum.amount ?? 0,
            totalCount: totalRevenue._count,
            thisMonth: thisMonthRevenue._sum.amount ?? 0,
            thisMonthCount: thisMonthRevenue._count,
            lastMonth: lastMonthRevenue._sum.amount ?? 0,
            lastMonthCount: lastMonthRevenue._count,
            thisYear: thisYearRevenue._sum.amount ?? 0,
            thisYearCount: thisYearRevenue._count,
          },
          mrr,
          arr: mrr * 12,
          paymentsByStatus: paymentsByStatus.map((p) => ({ status: p.status, count: p._count, amount: p._sum.amount ?? 0 })),
          revenueByPlan: revenueByPlan.map((p) => ({ plan: p.plan, count: p._count, amount: p._sum.amount ?? 0 })),
          revenueByPeriod: revenueByPeriod.map((p) => ({ period: p.period, count: p._count, amount: p._sum.amount ?? 0 })),
          monthlyRevenue,
          recentPayments: recentPayments.map((p) => ({
            id: p.id,
            amount: p.amount,
            plan: p.plan,
            period: p.period,
            status: p.status,
            paidAt: p.paidAt,
            createdAt: p.createdAt,
            clan: p.subscription?.clan ?? null,
          })),
          activeSubscriptionsCount: activeSubscriptions.length,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar estatísticas de faturamento:", error);
      return status(500, { message });
    }
  }

  /**
   * Cria ou atualiza subscription de um clan pelo email do owner.
   * Se o clan não existir (via clanTag), cria um novo.
   */
  async manageSubscription(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (!isAdmin(session)) return status(403, { message: "Acesso negado. Apenas administradores." });

      const { ownerEmail, newStatus, activeUntil, clanTag, plan } = body as {
        ownerEmail: string;
        newStatus: "ACTIVE" | "EXPIRED" | "CANCELLED";
        activeUntil?: string;
        clanTag?: string;
        plan?: string;
      };

      if (newStatus === "ACTIVE" && !activeUntil)
        return status(400, { message: "activeUntil é obrigatório para status ACTIVE" });

      const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
      if (!user) return status(404, { message: `Usuário não encontrado: ${ownerEmail}` });

      const currentPeriodEnd = activeUntil ? new Date(activeUntil) : null;

      // Find existing clan owned by this user
      const existingClan = clanTag
        ? await prisma.clan.findFirst({ where: { tag: clanTag.startsWith("#") ? clanTag : `#${clanTag}`, ownerId: user.id }, include: { subscription: true } })
        : await prisma.clan.findFirst({ where: { ownerId: user.id }, include: { subscription: true }, orderBy: { createdAt: "desc" } });

      let clan: any;
      let sub: any;
      let action: "created" | "updated";

      if (existingClan) {
        clan = existingClan;
        sub = existingClan.subscription;

        if (!sub) {
          sub = await prisma.subscription.create({
            data: { clanId: clan.id, plan: plan ?? "MESTRE", status: SubscriptionStatus[newStatus], paymentProvider: "syncpay", currentPeriodEnd, cancelAtPeriodEnd: false },
          });
        } else {
          sub = await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: SubscriptionStatus[newStatus], paymentProvider: "syncpay", paymentProviderId: null, currentPeriodEnd, cancelAtPeriodEnd: false, ...(plan ? { plan } : {}) },
          });
        }
        action = "updated";
      } else {
        if (!clanTag || !plan)
          return status(400, { message: "clanTag e plan são obrigatórios para criar o clan" });

        const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
        const tagTaken = await prisma.clan.findFirst({ where: { tag: normalizedTag } });
        if (tagTaken) return status(409, { message: `Já existe um clan com a tag "${normalizedTag}"` });

        const { ClashOfClansService } = await import("../services/clash-of-clans.service");
        const cocService = new ClashOfClansService();
        const clanData = await cocService.searchClanByTag(normalizedTag);

        clan = await prisma.clan.create({
          data: {
            tag: normalizedTag,
            name: clanData.name,
            ownerId: user.id,
            description: clanData.description,
            badgeUrls: clanData.badgeUrls ?? {},
            clanLevel: clanData.clanLevel ?? 0,
            clanPoints: clanData.clanPoints ?? 0,
            members: clanData.members ?? 0,
          },
        });

        sub = await prisma.subscription.create({
          data: { clanId: clan.id, plan, status: SubscriptionStatus[newStatus], paymentProvider: "syncpay", currentPeriodEnd, cancelAtPeriodEnd: false },
        });
        action = "created";
      }

      if (newStatus === "ACTIVE" && currentPeriodEnd) {
        const { scheduleSubscriptionExpiryCheck } = await import("../jobs/subscription-expiry.job");
        await scheduleSubscriptionExpiryCheck(clan.id, currentPeriodEnd);
      }

      return {
        success: true,
        action,
        clan: { id: clan.id, name: clan.name, tag: clan.tag },
        subscription: { id: sub.id, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao gerenciar subscription:", error);
      return status(500, { message });
    }
  }
}
