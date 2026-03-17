import { OrganizationRepository } from "../repositories/organization.repository";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { SubscriptionStatus } from "../generated/prisma";

export class OrganizationService {
  constructor(
    private organizationRepository: OrganizationRepository,
    private subscriptionService: SubscriptionService
  ) {}

  /**
   * Cria uma organização sem subscription (para admins)
   */
  async createOrganizationWithoutSubscription(
    userId: string,
    data: {
      name: string;
      slug: string;
      logo?: string | null;
    }
  ) {
    // Verifica se já existe organização com esse slug
    const existingOrg = await this.organizationRepository.findBySlug(data.slug);
    if (existingOrg) {
      throw new Error("Organização com esse slug já existe");
    }

    // Cria a organização
    const organization = await this.organizationRepository.create({
      name: data.name,
      slug: data.slug,
      logo: data.logo || null,
      metadata: {},
    });

    // Adiciona o usuário como membro (owner)
    await this.organizationRepository.addMember(
      organization.id,
      userId,
      "owner"
    );

    return {
      organization,
    };
  }

  /**
   * Cria uma organização com subscription em trial
   * IMPORTANTE: Só cria a organização se o usuário puder criar (não tem outra org)
   */
  async createOrganizationWithTrial(
    userId: string,
    data: {
      name: string;
      slug: string;
      logo?: string | null;
      plan: string;
    }
  ) {
    // Verifica se já existe organização com esse slug
    const existingOrg = await this.organizationRepository.findBySlug(data.slug);
    if (existingOrg) {
      throw new Error("Organização com esse slug já existe");
    }

    // Verifica se o usuário já utilizou um trial em alguma organização
    const { prisma } = await import("../lib/prisma");
    const existingTrial = await prisma.subscription.findFirst({
      where: {
        organization: {
          members: {
            some: {
              userId,
              role: "owner",
            },
          },
        },
        // Verifica se já teve uma subscription que começou como trial
        // Considera qualquer subscription que já existiu (mesmo que cancelada/expirada)
        // Isso previne que o usuário crie múltiplas contas para ganhar vários trials
      },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId,
                role: "owner",
              },
            },
          },
        },
      },
    });

    if (existingTrial) {
      throw new Error("Você já utilizou um período de trial em uma organização. Não é possível criar múltiplos trials.");
    }

    // Cria a organização
    const organization = await this.organizationRepository.create({
      name: data.name,
      slug: data.slug,
      logo: data.logo || null,
      metadata: {},
    });

    // Adiciona o usuário como membro (owner)
    await this.organizationRepository.addMember(
      organization.id,
      userId,
      "owner"
    );

    // Cria a subscription em trial
    const subscriptionRepository = new SubscriptionRepository();
    const trialEndsAt = this.subscriptionService.calculateTrialEndDate();
    await subscriptionRepository.create({
      organizationId: organization.id,
      plan: data.plan,
      status: SubscriptionStatus.TRIAL,
      trialEndsAt,
    });

    // Agenda verificação de expiração
    const { scheduleSubscriptionExpiryCheck } = await import(
      "../jobs/subscription-expiry.job"
    );
    await scheduleSubscriptionExpiryCheck(organization.id, trialEndsAt);

    return {
      organization,
      subscription: await subscriptionRepository.findByOrganizationId(
        organization.id
      ),
    };
  }

  /**
   * Ativa a subscription após pagamento aprovado
   */
  async activateSubscriptionAfterPayment(
    organizationId: string,
    currentPeriodEnd: Date,
    paymentProvider?: string,
    paymentProviderId?: string
  ) {
    const subscriptionRepository = new SubscriptionRepository();
    return await subscriptionRepository.activate(
      organizationId,
      currentPeriodEnd,
      paymentProvider,
      paymentProviderId
    );
  }

  /**
   * Verifica se o usuário tem permissão para acessar a organização
   */
  async canUserAccessOrganization(
    userId: string,
    organizationId: string
  ): Promise<{
    canAccess: boolean;
    role?: string;
    reason?: string;
  }> {
    // Primeiro verifica se o usuário é admin - admins podem acessar qualquer organização
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === "admin") {
      const organization = await this.organizationRepository.findById(
        organizationId
      );

      if (!organization) {
        return {
          canAccess: false,
          reason: "Organização não encontrada",
        };
      }

      // Admin pode acessar qualquer organização
      return {
        canAccess: true,
        role: "admin",
      };
    }

    const organization = await this.organizationRepository.findById(
      organizationId
    );

    if (!organization) {
      return {
        canAccess: false,
        reason: "Organização não encontrada",
      };
    }

    // Verifica se o usuário é membro
    const member = organization.members.find((m) => m.userId === userId);

    if (!member) {
      return {
        canAccess: false,
        reason: "Você não é membro desta organização",
      };
    }

    // Verifica se a subscription está ativa
    const subscriptionRepository = new SubscriptionRepository();
    const subscription = await subscriptionRepository.findByOrganizationId(
      organizationId
    );

    // Se não tem subscription, apenas o owner pode acessar (ou admin, já verificado acima)
    if (!subscription) {
      if (member.role === "owner") {
        return {
          canAccess: true,
          role: member.role,
        };
      }
      return {
        canAccess: false,
        reason: "Organização não possui assinatura ativa",
      };
    }

    if (subscription) {
      const isActive = this.subscriptionService.isSubscriptionActive(
        subscription
      );

      if (!isActive && member.role !== "owner") {
        return {
          canAccess: false,
          reason: "Assinatura expirada ou cancelada",
        };
      }
    }

    return {
      canAccess: true,
      role: member.role,
    };
  }

  async updateOrganization(
    organizationId: string,
    userId: string,
    data: { name?: string; slug?: string }
  ) {
    // Verifica se a organização existe
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica se o usuário é owner
    const member = organization.members.find((m) => m.userId === userId);
    if (!member) {
      throw new Error("Você não é membro desta organização");
    }

    // Verifica se é admin
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Apenas owner ou admin podem atualizar
    if (member.role !== "owner" && user?.role !== "admin") {
      throw new Error("Apenas o dono da organização pode atualizar");
    }

    // Se está atualizando o slug, verifica se já existe
    if (data.slug && data.slug !== organization.slug) {
      const existingOrg = await this.organizationRepository.findBySlug(data.slug);
      if (existingOrg) {
        throw new Error("Já existe uma organização com esse slug");
      }
    }

    // Atualiza a organização
    return await this.organizationRepository.update(organizationId, data);
  }

  async deleteOrganization(organizationId: string, userId: string, _skipLegacy: boolean = false) {
    // Verifica se a organização existe
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica se o usuário é owner
    const member = organization.members.find((m) => m.userId === userId);
    if (!member) {
      throw new Error("Você não é membro desta organização");
    }

    // Verifica se é admin
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Apenas owner ou admin podem deletar
    if (member.role !== "owner" && user?.role !== "admin") {
      throw new Error("Apenas o dono da organização pode deletar");
    }

    // Deleta a organização (cascata deleta membros, clans, invites, subscription)
    await this.organizationRepository.delete(organizationId);

    return { success: true };
  }
}
