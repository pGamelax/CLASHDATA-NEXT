import { auth } from "../auth";
import { prisma } from "../lib/prisma";
import { SubscriptionStatus } from "../generated/prisma";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class AdminController {
  async getDashboardStats(context: ElysiaContext) {
    const { request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      // Estatísticas de usuários
      const totalUsers = await prisma.user.count();
      const usersThisMonth = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      });

      // Estatísticas de organizações
      const totalOrganizations = await prisma.organization.count();
      const orgsThisMonth = await prisma.organization.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      });

      // Estatísticas de subscriptions
      const totalSubscriptions = await prisma.subscription.count();
      const activeSubscriptions = await prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
      });
      const trialSubscriptions = await prisma.subscription.count({
        where: {
          status: SubscriptionStatus.TRIAL,
        },
      });
      const expiredSubscriptions = await prisma.subscription.count({
        where: {
          status: SubscriptionStatus.EXPIRED,
        },
      });
      const cancelledSubscriptions = await prisma.subscription.count({
        where: {
          status: SubscriptionStatus.CANCELLED,
        },
      });

      // Distribuição por plano
      const subscriptionsByPlan = await prisma.subscription.groupBy({
        by: ["plan"],
        _count: {
          plan: true,
        },
      });

      // Organizações sem subscription
      const orgsWithoutSubscription = await prisma.organization.count({
        where: {
          subscription: null,
        },
      });

      // Clans totais
      const totalClans = await prisma.clan.count();

      // Usuários nos últimos 7 dias
      const usersLast7Days = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Usuários recentes (últimos 8)
      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          banned: true,
          createdAt: true,
        },
      });

      // Assinaturas expirando em 7 dias
      const expiringSoonList = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { currentPeriodEnd: "asc" },
      });

      // Organizações recentes (últimas 5)
      const recentOrganizations = await prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          subscription: { select: { plan: true, status: true } },
        },
      });

      // Clans por organização (top 5 orgs com mais clans)
      const clansByOrg = await prisma.clan.groupBy({
        by: ["organizationId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      });

      return {
        success: true,
        stats: {
          users: {
            total: totalUsers,
            thisMonth: usersThisMonth,
            last7Days: usersLast7Days,
            recent: recentUsers,
          },
          organizations: {
            total: totalOrganizations,
            thisMonth: orgsThisMonth,
            withoutSubscription: orgsWithoutSubscription,
            recent: recentOrganizations.map((o) => ({
              id: o.id,
              name: o.name,
              slug: o.slug,
              createdAt: o.createdAt,
              subscription: o.subscription
                ? { plan: o.subscription.plan, status: o.subscription.status }
                : null,
            })),
          },
          subscriptions: {
            total: totalSubscriptions,
            active: activeSubscriptions,
            trial: trialSubscriptions,
            expired: expiredSubscriptions,
            cancelled: cancelledSubscriptions,
            byPlan: subscriptionsByPlan.map((item) => ({
              plan: item.plan,
              count: item._count.plan,
            })),
            expiringSoon: expiringSoonList.map((s) => ({
              id: s.id,
              plan: s.plan,
              currentPeriodEnd: s.currentPeriodEnd,
              organization: s.organization,
            })),
          },
          clans: {
            total: totalClans,
          },
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar estatísticas do admin:", error);
      return status(500, { message });
    }
  }

  async getSubscriptions(context: ElysiaContext) {
    const { request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const subscriptions = await prisma.subscription.findMany({
        include: {
          organization: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: subscriptions,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar subscriptions:", error);
      return status(500, { message });
    }
  }

  async getOrganizations(context: ElysiaContext) {
    const { request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const organizations = await prisma.organization.findMany({
        include: {
          subscription: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          clans: {
            select: {
              id: true,
              name: true,
              tag: true,
            },
          },
          _count: {
            select: {
              members: true,
              clans: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: organizations,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar organizações:", error);
      return status(500, { message });
    }
  }

  async getUsers(context: ElysiaContext) {
    const { request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const users = await prisma.user.findMany({
        include: {
          members: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar usuários:", error);
      return status(500, { message });
    }
  }

  async createOrganization(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { name, slug } = body as {
        name: string;
        slug: string;
      };

      if (!name || !slug) {
        return status(400, {
          message: "Nome e slug da organização são obrigatórios",
        });
      }

      // Usa o OrganizationService para criar a organização sem subscription
      const { OrganizationService } = await import("../services/organization.service");
      const { OrganizationRepository } = await import("../repositories/organization.repository");
      const { SubscriptionService } = await import("../services/subscription.service");
      const { SubscriptionRepository } = await import("../repositories/subscription.repository");

      const organizationRepository = new OrganizationRepository();
      const subscriptionRepository = new SubscriptionRepository();
      const subscriptionService = new SubscriptionService(subscriptionRepository);
      const organizationService = new OrganizationService(
        organizationRepository,
        subscriptionService
      );

      const result = await organizationService.createOrganizationWithoutSubscription(
        session.user.id,
        {
          name,
          slug,
        }
      );

      return {
        success: true,
        organization: result.organization,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao criar organização:", error);

      if (message.includes("já existe")) {
        return status(409, { message });
      }

      return status(500, { message });
    }
  }

  async getClans(context: ElysiaContext) {
    const { request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const clans = await prisma.clan.findMany({
        include: {
          organization: {
            include: {
              subscription: true,
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: clans,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar clans:", error);
      return status(500, { message });
    }
  }

  async cancelOrganizationSubscription(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { organizationId } = params as { organizationId: string };

      // Busca a subscription
      const subscription = await prisma.subscription.findUnique({
        where: { organizationId },
      });

      if (!subscription) {
        return status(404, { message: "Subscription não encontrada" });
      }

      // Cancela a subscription no banco
      const { SubscriptionRepository } = await import("../repositories/subscription.repository");
      const subscriptionRepository = new SubscriptionRepository();
      await subscriptionRepository.cancel(organizationId);

      return {
        success: true,
        message: "Assinatura cancelada com sucesso",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao cancelar assinatura:", error);
      return status(500, { message });
    }
  }

  async deleteOrganization(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { organizationId } = params as { organizationId: string };

      // Busca a organização
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          subscription: true,
        },
      });

      if (!organization) {
        return status(404, { message: "Organização não encontrada" });
      }

      // Deleta a organização (cascade deleta subscription, members, clans, invites)
      await prisma.organization.delete({
        where: { id: organizationId },
      });

      return {
        success: true,
        message: "Organização excluída com sucesso",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao excluir organização:", error);
      return status(500, { message });
    }
  }

  async deleteUser(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { userId } = params as { userId: string };

      // Não permite excluir a si mesmo
      if (userId === session.user.id) {
        return status(400, { message: "Você não pode excluir sua própria conta" });
      }

      // Busca o usuário
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return status(404, { message: "Usuário não encontrado" });
      }

      // Deleta o usuário (cascade deleta accounts, sessions, members, invites)
      await prisma.user.delete({
        where: { id: userId },
      });

      return {
        success: true,
        message: "Usuário excluído com sucesso",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao excluir usuário:", error);
      return status(500, { message });
    }
  }

  async updateUser(context: ElysiaContext) {
    const { params, body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { userId } = params as { userId: string };
      const updateData = body as {
        name?: string;
        email?: string;
        role?: string;
        banned?: boolean;
      };

      // Verifica se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return status(404, { message: "Usuário não encontrado" });
      }

      // Valida role se fornecido
      if (updateData.role && !["user", "admin"].includes(updateData.role)) {
        return status(400, { message: "Role inválido. Deve ser 'user' ou 'admin'" });
      }

      // Verifica se email já existe (se estiver sendo alterado)
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (emailExists) {
          return status(409, { message: "Email já está em uso" });
        }
      }

      // Atualiza o usuário
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(updateData.name !== undefined && { name: updateData.name }),
          ...(updateData.email !== undefined && { email: updateData.email }),
          ...(updateData.role !== undefined && { role: updateData.role }),
          ...(updateData.banned !== undefined && { banned: updateData.banned }),
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao atualizar usuário:", error);
      return status(500, { message });
    }
  }

  async updateOrganization(context: ElysiaContext) {
    const { params, body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { organizationId } = params as { organizationId: string };
      const updateData = body as {
        name?: string;
        slug?: string;
      };

      // Verifica se a organização existe
      const existingOrg = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!existingOrg) {
        return status(404, { message: "Organização não encontrada" });
      }

      // Verifica se slug já existe (se estiver sendo alterado)
      if (updateData.slug && updateData.slug !== existingOrg.slug) {
        const slugExists = await prisma.organization.findUnique({
          where: { slug: updateData.slug },
        });

        if (slugExists) {
          return status(409, { message: "Slug já está em uso" });
        }
      }

      // Atualiza a organização
      const updatedOrg = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(updateData.name !== undefined && { name: updateData.name }),
          ...(updateData.slug !== undefined && { slug: updateData.slug }),
        },
      });

      return {
        success: true,
        organization: updatedOrg,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao atualizar organização:", error);
      return status(500, { message });
    }
  }

  async deleteClan(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { clanId } = params as { clanId: string };

      // Verifica se o clan existe
      const clan = await prisma.clan.findUnique({
        where: { id: clanId },
      });

      if (!clan) {
        return status(404, { message: "Clan não encontrado" });
      }

      // Deleta o clan
      await prisma.clan.delete({
        where: { id: clanId },
      });

      return {
        success: true,
        message: "Clan excluído com sucesso",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao excluir clan:", error);
      return status(500, { message });
    }
  }

  async createOrganizationWithManualSubscription(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { name, slug, ownerEmail, plan, daysUntilExpiry } = body as {
        name: string;
        slug: string;
        ownerEmail: string;
        plan: string;
        daysUntilExpiry: number;
      };

      if (!name || !slug || !ownerEmail || !plan || !daysUntilExpiry) {
        return status(400, {
          message: "Todos os campos são obrigatórios",
        });
      }

      // Valida dias até expiração
      if (daysUntilExpiry <= 0) {
        return status(400, {
          message: "Dias até expiração deve ser maior que zero",
        });
      }

      // Busca o usuário pelo email
      const owner = await prisma.user.findUnique({
        where: { email: ownerEmail },
      });

      if (!owner) {
        return status(404, {
          message: "Usuário com esse email não encontrado",
        });
      }

      // Verifica se já existe organização com esse slug
      const existingOrg = await prisma.organization.findUnique({
        where: { slug },
      });

      if (existingOrg) {
        return status(409, {
          message: "Já existe uma organização com esse slug",
        });
      }

      // Cria a organização
      const organization = await prisma.organization.create({
        data: {
          name,
          slug,
          metadata: {},
        },
      });

      // Adiciona o usuário como owner
      await prisma.member.create({
        data: {
          organizationId: organization.id,
          userId: owner.id,
          role: "owner",
        },
      });

      // Calcula a data de expiração
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + daysUntilExpiry);

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: organization.id,
          plan: plan as any,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd,
          paymentProvider: "manual",
        },
        include: {
          organization: true,
        },
      });

      // Agenda verificação de expiração
      const { scheduleSubscriptionExpiryCheck } = await import(
        "../jobs/subscription-expiry.job"
      );
      await scheduleSubscriptionExpiryCheck(organization.id, currentPeriodEnd);

      return {
        success: true,
        organization,
        subscription,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao criar organização com assinatura manual:", error);

      if (message.includes("já existe") || message.includes("já está em uso")) {
        return status(409, { message });
      }

      return status(500, { message });
    }
  }

  async reactivateSubscription(context: ElysiaContext) {
    const { params, body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Verifica se é admin
      if (session.user.role !== "admin") {
        return status(403, { message: "Acesso negado. Apenas administradores." });
      }

      const { organizationId } = params as { organizationId: string };
      const { daysUntilExpiry } = body as { daysUntilExpiry: number };

      if (!daysUntilExpiry || daysUntilExpiry <= 0) {
        return status(400, {
          message: "Dias até expiração deve ser maior que zero",
        });
      }

      // Busca a subscription
      const subscription = await prisma.subscription.findUnique({
        where: { organizationId },
      });

      if (!subscription) {
        return status(404, { message: "Subscription não encontrada" });
      }

      // Calcula a nova data de expiração
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + daysUntilExpiry);

      // Atualiza a subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { organizationId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
        include: {
          organization: true,
        },
      });

      // Agenda verificação de expiração
      const { scheduleSubscriptionExpiryCheck } = await import(
        "../jobs/subscription-expiry.job"
      );
      await scheduleSubscriptionExpiryCheck(organizationId, currentPeriodEnd);

      return {
        success: true,
        subscription: updatedSubscription,
        message: "Assinatura reativada com sucesso",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao reativar assinatura:", error);
      return status(500, { message });
    }
  }

  /**
   * Migra um cliente da Stripe para o novo sistema.
   * - Se a org já existe: atualiza a subscription.
   * - Se não existe: cria a org + subscription e adiciona o user como owner.
   * Campos orgName, orgSlug e plan são obrigatórios apenas quando a org não existe.
   */
  async manageSubscription(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });
      if (session.user.role !== "admin") return status(403, { message: "Acesso negado. Apenas administradores." });

      const { ownerEmail, newStatus, activeUntil, orgName, orgSlug, plan } = body as {
        ownerEmail: string;
        newStatus: "ACTIVE" | "EXPIRED" | "CANCELLED";
        activeUntil?: string;
        orgName?: string;
        orgSlug?: string;
        plan?: string;
      };

      if (newStatus === "ACTIVE" && !activeUntil)
        return status(400, { message: "activeUntil é obrigatório para status ACTIVE" });

      const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
      if (!user) return status(404, { message: `Usuário não encontrado: ${ownerEmail}` });

      const currentPeriodEnd = activeUntil ? new Date(activeUntil) : null;

      // Busca org existente onde ele é owner
      const member = await prisma.member.findFirst({
        where: { userId: user.id, role: "owner" },
        include: { organization: { include: { subscription: true } } },
      });

      let org: any;
      let sub: any;
      let action: "created" | "updated";

      if (member) {
        // Org existe — apenas atualiza a subscription
        org = member.organization;
        sub = org.subscription;

        if (!sub) {
          // Org sem subscription — cria
          sub = await prisma.subscription.create({
            data: {
              organizationId: org.id,
              plan: plan ?? "MESTRE",
              status: SubscriptionStatus[newStatus],
              paymentProvider: "syncpay",
              currentPeriodEnd,
              cancelAtPeriodEnd: false,
            },
          });
        } else {
          sub = await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: SubscriptionStatus[newStatus],
              paymentProvider: "syncpay",
              paymentProviderId: null,
              currentPeriodEnd,
              cancelAtPeriodEnd: false,
              ...(plan ? { plan } : {}),
            },
          });
        }
        action = "updated";
      } else {
        // Org não existe — cria tudo
        if (!orgName || !orgSlug || !plan)
          return status(400, { message: "orgName, orgSlug e plan são obrigatórios para criar a organização" });

        const existing = await prisma.organization.findUnique({ where: { slug: orgSlug } });
        if (existing) return status(409, { message: `Já existe uma organização com slug "${orgSlug}"` });

        org = await prisma.organization.create({
          data: { name: orgName, slug: orgSlug, metadata: {} },
        });

        await prisma.member.create({
          data: { organizationId: org.id, userId: user.id, role: "owner" },
        });

        sub = await prisma.subscription.create({
          data: {
            organizationId: org.id,
            plan,
            status: SubscriptionStatus[newStatus],
            paymentProvider: "syncpay",
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
          },
        });
        action = "created";
      }

      if (newStatus === "ACTIVE" && currentPeriodEnd) {
        const { scheduleSubscriptionExpiryCheck } = await import("../jobs/subscription-expiry.job");
        await scheduleSubscriptionExpiryCheck(org.id, currentPeriodEnd);
      }

      return {
        success: true,
        action,
        organization: { id: org.id, name: org.name, slug: org.slug },
        subscription: { id: sub.id, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao migrar subscription Stripe:", error);
      return status(500, { message });
    }
  }
}
