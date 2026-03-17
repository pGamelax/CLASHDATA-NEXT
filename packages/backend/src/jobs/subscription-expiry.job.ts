import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { env } from "../env";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { SubscriptionStatus } from "../generated/prisma";

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const subscriptionExpiryQueue = new Queue("subscription-expiry", {
  connection,
});

// Worker para processar jobs de expiração individuais
export const subscriptionExpiryWorker = new Worker(
  "subscription-expiry",
  async (job) => {
    if (job.name === "check-all-expired") return;

    const { organizationId } = job.data;
    if (!organizationId) {
      console.error("Job de expiração sem organizationId:", job.id);
      return;
    }

    const subscriptionRepository = new SubscriptionRepository();
    const subscription = await subscriptionRepository.findByOrganizationId(organizationId);
    if (!subscription) return;

    const now = new Date();

    const isTrialExpired =
      subscription.status === SubscriptionStatus.TRIAL &&
      subscription.trialEndsAt &&
      now >= subscription.trialEndsAt;

    const isPeriodExpired =
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.currentPeriodEnd &&
      now >= subscription.currentPeriodEnd;

    if (isTrialExpired || isPeriodExpired) {
      await subscriptionRepository.expire(organizationId);
    }
  },
  { connection }
);

/**
 * Agenda verificação de expiração para uma subscription específica
 */
export async function scheduleSubscriptionExpiryCheck(
  organizationId: string,
  expiresAt: Date
) {
  await subscriptionExpiryQueue.removeRepeatableByKey(
    `subscription-expiry:${organizationId}:*`
  );

  const checkDate = new Date(expiresAt);
  checkDate.setMinutes(checkDate.getMinutes() + 1);

  await subscriptionExpiryQueue.add(
    `expire-${organizationId}`,
    { organizationId },
    {
      repeat: {
        pattern: `0 ${checkDate.getMinutes()} ${checkDate.getHours()} ${checkDate.getDate()} ${checkDate.getMonth() + 1} *`,
      },
      jobId: `subscription-expiry:${organizationId}:${expiresAt.getTime()}`,
    }
  );
}

/**
 * Job recorrente para verificar todas as subscriptions expiradas
 * Executa a cada hora
 */
export async function setupSubscriptionExpiryJob() {
  const jobs = await subscriptionExpiryQueue.getRepeatableJobs();
  for (const job of jobs) {
    if (job.name === "check-all-expired") {
      await subscriptionExpiryQueue.removeRepeatableByKey(job.key);
    }
  }

  await subscriptionExpiryQueue.add(
    "check-all-expired",
    {},
    {
      repeat: { pattern: "0 * * * *" },
      jobId: "subscription-expiry:check-all",
    }
  );

  const checkAllWorker = new Worker(
    "subscription-expiry",
    async (job) => {
      if (job.name !== "check-all-expired") return;

      const subscriptionRepository = new SubscriptionRepository();
      const { prisma } = await import("../lib/prisma");

      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: { in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE] },
        },
      });

      const now = new Date();

      for (const subscription of subscriptions) {
        const isTrialExpired =
          subscription.status === SubscriptionStatus.TRIAL &&
          subscription.trialEndsAt &&
          now >= subscription.trialEndsAt;

        const isPeriodExpired =
          subscription.status === SubscriptionStatus.ACTIVE &&
          subscription.currentPeriodEnd &&
          now >= subscription.currentPeriodEnd;

        if (isTrialExpired || isPeriodExpired) {
          await subscriptionExpiryQueue.add(
            `expire-${subscription.organizationId}`,
            { organizationId: subscription.organizationId },
            {
              jobId: `subscription-expiry:${subscription.organizationId}:${now.getTime()}`,
            }
          );
        }
      }
    },
    { connection }
  );

  return checkAllWorker;
}
