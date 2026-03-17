import { prisma } from "../lib/prisma";
import { SubscriptionStatus } from "../generated/prisma";

export class SubscriptionRepository {
  async findByOrganizationId(organizationId: string) {
    if (!organizationId) {
      return null;
    }
    
    return await prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        organization: true,
      },
    });
  }

  async create(data: {
    organizationId: string;
    plan: string;
    status?: SubscriptionStatus;
    trialEndsAt?: Date;
    currentPeriodEnd?: Date;
    paymentProvider?: string;
    paymentProviderId?: string;
  }) {
    return await prisma.subscription.create({
      data,
      include: {
        organization: true,
      },
    });
  }

  async update(
    organizationId: string,
    data: {
      plan?: string;
      status?: SubscriptionStatus;
      trialEndsAt?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
      paymentProvider?: string;
      paymentProviderId?: string;
    }
  ) {
    return await prisma.subscription.update({
      where: { organizationId },
      data,
      include: {
        organization: true,
      },
    });
  }

  async cancel(organizationId: string) {
    return await prisma.subscription.update({
      where: { organizationId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
      },
      include: {
        organization: true,
      },
    });
  }

  async activate(
    organizationId: string,
    currentPeriodEnd: Date,
    paymentProvider?: string,
    paymentProviderId?: string
  ) {
    return await prisma.subscription.update({
      where: { organizationId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        paymentProvider,
        paymentProviderId,
      },
      include: {
        organization: true,
      },
    });
  }

  async expire(organizationId: string) {
    return await prisma.subscription.update({
      where: { organizationId },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
      include: {
        organization: true,
      },
    });
  }
}
