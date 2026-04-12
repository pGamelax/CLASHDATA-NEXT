import { SubscriptionRepository } from "../repositories/subscription.repository";
import { SubscriptionStatus } from "../generated/prisma";

export interface PlanLimits {
  price: number;
}

/** Fallback hardcoded limits — used when DB is unavailable */
export const PLAN_LIMITS_FALLBACK: Record<string, PlanLimits> = {
  MESTRE:  { price: 29.90 },
  CAMPEAO: { price: 45.90 },
  TITA:    { price: 74.90 },
  LEGEND:  { price: 119.90 },
};

const TRIAL_DAYS = 3;

export class SubscriptionService {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  getPlanLimits(plan: string): PlanLimits {
    return PLAN_LIMITS_FALLBACK[plan] ?? { price: 0 };
  }

  calculateTrialEndDate(): Date {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    return trialEnd;
  }

  isSubscriptionActive(subscription: {
    status: SubscriptionStatus;
    trialEndsAt?: Date | null;
    currentPeriodEnd?: Date | null;
  }): boolean {
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      if (subscription.currentPeriodEnd) {
        return new Date() < subscription.currentPeriodEnd;
      }
      return true;
    }

    if (subscription.status === SubscriptionStatus.TRIAL) {
      if (subscription.trialEndsAt) {
        return new Date() < subscription.trialEndsAt;
      }
      return true;
    }

    return false;
  }

  async createTrialSubscription(clanId: string, plan: string) {
    const trialEndsAt = this.calculateTrialEndDate();
    return await this.subscriptionRepository.create({
      clanId,
      plan,
      status: SubscriptionStatus.TRIAL,
      trialEndsAt,
    });
  }

  async activateSubscription(
    clanId: string,
    currentPeriodEnd: Date,
    paymentProvider?: string,
    paymentProviderId?: string
  ) {
    return await this.subscriptionRepository.activate(
      clanId,
      currentPeriodEnd,
      paymentProvider,
      paymentProviderId
    );
  }
}
