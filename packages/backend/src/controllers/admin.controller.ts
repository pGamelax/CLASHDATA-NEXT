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

      // Cancela no Stripe se tiver paymentProviderId
      if (subscription.paymentProviderId) {
        try {
          const { StripeService } = await import("../services/stripe.service");
          const stripeService = new StripeService();
          await stripeService.cancelSubscription(
            subscription.paymentProviderId,
            false // cancelAtPeriodEnd = false (cancela imediatamente)
          );
        } catch (error) {
          console.error("Erro ao cancelar subscription no Stripe:", error);
          // Continua mesmo se houver erro no Stripe
        }
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

      // Cancela subscription no Stripe se existir
      if (organization.subscription?.paymentProviderId) {
        try {
          const { StripeService } = await import("../services/stripe.service");
          const stripeService = new StripeService();
          await stripeService.cancelSubscription(
            organization.subscription.paymentProviderId,
            false
          );
        } catch (error) {
          console.error("Erro ao cancelar subscription no Stripe:", error);
          // Continua mesmo se houver erro no Stripe
        }
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
}
