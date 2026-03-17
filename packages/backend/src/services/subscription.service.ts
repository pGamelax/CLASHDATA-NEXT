import { SubscriptionRepository } from "../repositories/subscription.repository";
import { SubscriptionStatus } from "../generated/prisma";

export interface PlanLimits {
  maxClans: number;
  maxInvites: number;
  price: number;
}

/** Fallback hardcoded limits — used when DB is unavailable */
export const PLAN_LIMITS_FALLBACK: Record<string, PlanLimits> = {
  MESTRE:  { maxClans: 1, maxInvites: 1, price: 29.90 },
  CAMPEAO: { maxClans: 2, maxInvites: 2, price: 45.90 },
  TITA:    { maxClans: 3, maxInvites: 3, price: 74.90 },
  LEGEND:  { maxClans: 5, maxInvites: 5, price: 119.90 },
};

const TRIAL_DAYS = 3;

export class SubscriptionService {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  getPlanLimits(plan: string): PlanLimits {
    return PLAN_LIMITS_FALLBACK[plan] ?? { maxClans: 1, maxInvites: 1, price: 0 };
  }

  /**
   * Calcula a data de término do trial (3 dias a partir de agora)
   */
  calculateTrialEndDate(): Date {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    return trialEnd;
  }

  /**
   * Verifica se uma subscription está ativa (trial ou paga)
   */
  isSubscriptionActive(subscription: {
    status: SubscriptionStatus;
    trialEndsAt?: Date | null;
    currentPeriodEnd?: Date | null;
  }): boolean {
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      // Verifica se o período atual não expirou
      if (subscription.currentPeriodEnd) {
        return new Date() < subscription.currentPeriodEnd;
      }
      return true;
    }

    if (subscription.status === SubscriptionStatus.TRIAL) {
      // Verifica se o trial não expirou
      if (subscription.trialEndsAt) {
        return new Date() < subscription.trialEndsAt;
      }
      return true;
    }

    return false;
  }

  /**
   * Cria uma subscription em trial para uma organização
   */
  async createTrialSubscription(
    organizationId: string,
    plan: string
  ) {
    const trialEndsAt = this.calculateTrialEndDate();

    return await this.subscriptionRepository.create({
      organizationId,
      plan,
      status: SubscriptionStatus.TRIAL,
      trialEndsAt,
    });
  }

  /**
   * Ativa uma subscription após pagamento aprovado
   */
  async activateSubscription(
    organizationId: string,
    currentPeriodEnd: Date,
    paymentProvider?: string,
    paymentProviderId?: string
  ) {
    return await this.subscriptionRepository.activate(
      organizationId,
      currentPeriodEnd
    );
  }

  /**
   * Verifica se o usuário pode criar ou participar de uma organização
   * SEM LIMITE: usuários podem criar ou participar de quantas organizações quiserem
   */
  async canUserCreateOrJoinOrganization(userId: string): Promise<{
    canCreate: boolean;
    canJoin: boolean;
    reason?: string;
  }> {
    // Sem limite - sempre permite criar ou participar
    return {
      canCreate: true,
      canJoin: true,
    };
  }

  /**
   * Verifica se uma organização pode adicionar mais clans
   * Organizações sem subscription (criadas por admin) podem adicionar quantos clans quiserem
   */
  async canAddClan(organizationId: string, userId?: string): Promise<{
    canAdd: boolean;
    reason?: string;
    currentCount: number;
    maxCount: number;
  }> {
    const subscription = await this.subscriptionRepository.findByOrganizationId(
      organizationId
    );

    // Se não tem subscription, verifica se foi criada por admin
    if (!subscription) {
      // Se userId for fornecido, verifica se é admin
      if (userId) {
        const { prisma } = await import("../lib/prisma");
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        
        if (user?.role === "admin") {
          // Admin pode adicionar quantos clans quiser
          const clanCount = await prisma.clan.count({
            where: { organizationId },
          });
          return {
            canAdd: true,
            currentCount: clanCount,
            maxCount: 999999, // Ilimitado para admin
          };
        }
      }
      
      return {
        canAdd: false,
        reason: "Organização não possui assinatura",
        currentCount: 0,
        maxCount: 0,
      };
    }

    if (!this.isSubscriptionActive(subscription)) {
      return {
        canAdd: false,
        reason: "Assinatura expirada ou cancelada",
        currentCount: 0,
        maxCount: 0,
      };
    }

    const limits = this.getPlanLimits(subscription.plan);

    // Contar clans atuais
    const { prisma } = await import("../lib/prisma");
    const clanCount = await prisma.clan.count({
      where: { organizationId },
    });

    if (clanCount >= limits.maxClans) {
      return {
        canAdd: false,
        reason: `Limite de ${limits.maxClans} clan(s) atingido para o plano ${subscription.plan}`,
        currentCount: clanCount,
        maxCount: limits.maxClans,
      };
    }

    return {
      canAdd: true,
      currentCount: clanCount,
      maxCount: limits.maxClans,
    };
  }

  /**
   * Verifica se uma organização pode adicionar mais convites
   * Admins podem adicionar quantos convites quiserem
   */
  async canAddInvite(organizationId: string, userId?: string): Promise<{
    canAdd: boolean;
    reason?: string;
    currentCount: number;
    maxCount: number;
  }> {
    // Se userId for fornecido, verifica se é admin
    if (userId) {
      const { prisma } = await import("../lib/prisma");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      
      if (user?.role === "admin") {
        // Admin pode adicionar quantos convites quiser
        const memberCount = await prisma.member.count({
          where: {
            organizationId,
            role: {
              not: "owner",
            },
          },
        });
        return {
          canAdd: true,
          currentCount: memberCount,
          maxCount: 999999, // Ilimitado para admin
        };
      }
    }

    const subscription = await this.subscriptionRepository.findByOrganizationId(
      organizationId
    );

    if (!subscription) {
      return {
        canAdd: false,
        reason: "Organização não possui assinatura",
        currentCount: 0,
        maxCount: 0,
      };
    }

    if (!this.isSubscriptionActive(subscription)) {
      return {
        canAdd: false,
        reason: "Assinatura expirada ou cancelada",
        currentCount: 0,
        maxCount: 0,
      };
    }

    const limits = this.getPlanLimits(subscription.plan);

    // Contar membros (excluindo o owner)
    const { prisma } = await import("../lib/prisma");
    const memberCount = await prisma.member.count({
      where: {
        organizationId,
        role: { not: "owner" },
      },
    });

    if (memberCount >= limits.maxInvites) {
      return {
        canAdd: false,
        reason: `Limite de ${limits.maxInvites} convite(s) atingido para o plano ${subscription.plan}`,
        currentCount: memberCount,
        maxCount: limits.maxInvites,
      };
    }

    return {
      canAdd: true,
      currentCount: memberCount,
      maxCount: limits.maxInvites,
    };
  }
}
