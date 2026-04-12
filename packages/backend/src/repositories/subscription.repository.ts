import { prisma } from "../lib/prisma";
import { SubscriptionStatus } from "../generated/prisma";

export class SubscriptionRepository {
  async findByClanId(clanId: string) {
    if (!clanId) return null;
    return await prisma.subscription.findUnique({
      where: { clanId },
      include: { clan: { include: { owner: true } } },
    });
  }

  async create(data: {
    clanId: string;
    plan: string;
    status?: SubscriptionStatus;
    period?: string;
    trialEndsAt?: Date;
    currentPeriodEnd?: Date;
    paymentProvider?: string;
    paymentProviderId?: string;
  }) {
    return await prisma.subscription.create({
      data,
      include: { clan: true },
    });
  }

  async update(
    clanId: string,
    data: {
      plan?: string;
      status?: SubscriptionStatus;
      period?: string;
      trialEndsAt?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
      pendingPlan?: string | null;
      paymentProvider?: string;
      paymentProviderId?: string;
    }
  ) {
    return await prisma.subscription.update({
      where: { clanId },
      data,
      include: { clan: true },
    });
  }

  async cancel(clanId: string) {
    return await prisma.subscription.update({
      where: { clanId },
      data: { status: SubscriptionStatus.CANCELLED, cancelAtPeriodEnd: true },
      include: { clan: true },
    });
  }

  async activate(
    clanId: string,
    currentPeriodEnd: Date,
    paymentProvider?: string,
    paymentProviderId?: string
  ) {
    return await prisma.subscription.update({
      where: { clanId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        paymentProvider,
        paymentProviderId,
      },
      include: { clan: true },
    });
  }

  async expire(clanId: string) {
    const sub = await prisma.subscription.findUnique({ where: { clanId } });
    return await prisma.subscription.update({
      where: { clanId },
      data: {
        status: SubscriptionStatus.EXPIRED,
        ...(sub?.pendingPlan ? { plan: sub.pendingPlan, pendingPlan: null } : {}),
      },
      include: { clan: true },
    });
  }
}
