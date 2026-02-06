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

      return {
        success: true,
        stats: {
          users: {
            total: totalUsers,
            thisMonth: usersThisMonth,
          },
          organizations: {
            total: totalOrganizations,
            thisMonth: orgsThisMonth,
            withoutSubscription: orgsWithoutSubscription,
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
}
