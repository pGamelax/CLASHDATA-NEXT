import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { env } from "../env";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { SubscriptionStatus } from "../generated/prisma";
import { StripeService } from "../services/stripe.service";

// Criar conexão Redis com configuração correta para BullMQ
const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Queue para processar expiração de subscriptions
export const subscriptionExpiryQueue = new Queue("subscription-expiry", {
  connection,
});

// Worker para processar jobs de expiração
export const subscriptionExpiryWorker = new Worker(
  "subscription-expiry",
  async (job) => {
    // Ignora jobs de verificação geral (check-all-expired)
    if (job.name === "check-all-expired") {
      return;
    }

    const { organizationId } = job.data;

    // Valida se organizationId existe
    if (!organizationId) {
      console.error("Job de expiração sem organizationId:", job.id);
      return;
    }

    const subscriptionRepository = new SubscriptionRepository();
    const subscription = await subscriptionRepository.findByOrganizationId(
      organizationId
    );

    if (!subscription) {
      return;
    }

    // Verifica se a subscription já está expirada
    const now = new Date();
    const isExpired =
      subscription.status === SubscriptionStatus.TRIAL &&
      subscription.trialEndsAt &&
      now >= subscription.trialEndsAt;

    const isPeriodExpired =
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.currentPeriodEnd &&
      now >= subscription.currentPeriodEnd;

    if (isExpired || isPeriodExpired) {
      // Se tem paymentProviderId, verifica no Stripe
      if (subscription.paymentProviderId && subscription.paymentProvider === "stripe") {
        try {
          const stripeService = new StripeService();
          const stripeSubscription = await stripeService.getSubscription(
            subscription.paymentProviderId
          );

          // Se a subscription do Stripe ainda está ativa, atualiza baseado no status do Stripe
          if (stripeSubscription.status === "active" || stripeSubscription.status === "trialing") {
            // Atualiza baseado no status do Stripe
            if (stripeSubscription.status === "trialing") {
              await subscriptionRepository.update(organizationId, {
                status: SubscriptionStatus.TRIAL,
                trialEndsAt: stripeSubscription.trial_end
                  ? new Date(stripeSubscription.trial_end * 1000)
                  : null,
                currentPeriodEnd: stripeSubscription.current_period_end
                  ? new Date(stripeSubscription.current_period_end * 1000)
                  : null,
              });
            } else {
              await subscriptionRepository.update(organizationId, {
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: stripeSubscription.current_period_end
                  ? new Date(stripeSubscription.current_period_end * 1000)
                  : null,
              });
            }
            return;
          }
        } catch (error) {
          // Erro ao verificar no Stripe - continua com expiração local
        }
      }

      await subscriptionRepository.expire(organizationId);
    }
  },
  {
    connection,
  }
);

/**
 * Agenda verificação de expiração para uma subscription
 */
export async function scheduleSubscriptionExpiryCheck(
  organizationId: string,
  expiresAt: Date
) {
  // Remove jobs anteriores para a mesma organização
  await subscriptionExpiryQueue.removeRepeatableByKey(
    `subscription-expiry:${organizationId}:*`
  );

  // Agenda verificação 1 minuto após a expiração
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
  // Remove job anterior se existir
  const jobs = await subscriptionExpiryQueue.getRepeatableJobs();
  for (const job of jobs) {
    if (job.name === "check-all-expired") {
      await subscriptionExpiryQueue.removeRepeatableByKey(job.key);
    }
  }

  // Agenda job para verificar todas as subscriptions a cada hora
  await subscriptionExpiryQueue.add(
    "check-all-expired",
    {},
    {
      repeat: {
        pattern: "0 * * * *", // A cada hora
      },
      jobId: "subscription-expiry:check-all",
    }
  );

  // Worker para processar verificação de todas as subscriptions
  const checkAllWorker = new Worker(
    "subscription-expiry",
    async (job) => {
      if (job.name === "check-all-expired") {
        const subscriptionRepository = new SubscriptionRepository();
        const { prisma } = await import("../lib/prisma");

        // Busca todas as subscriptions que podem estar expiradas
        const subscriptions = await prisma.subscription.findMany({
          where: {
            status: {
              in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE],
            },
          },
        });

        const now = new Date();

        for (const subscription of subscriptions) {
          const isExpired =
            subscription.status === SubscriptionStatus.TRIAL &&
            subscription.trialEndsAt &&
            now >= subscription.trialEndsAt;

          const isPeriodExpired =
            subscription.status === SubscriptionStatus.ACTIVE &&
            subscription.currentPeriodEnd &&
            now >= subscription.currentPeriodEnd;

          if (isExpired || isPeriodExpired) {
            // Agenda job individual para processar
            await subscriptionExpiryQueue.add(
              `expire-${subscription.organizationId}`,
              { organizationId: subscription.organizationId },
              {
                jobId: `subscription-expiry:${subscription.organizationId}:${now.getTime()}`,
              }
            );
          }
        }
      }
    },
    {
      connection,
    }
  );

  return checkAllWorker;
}
