import Stripe from "stripe";
import { env } from "../env";
import { SubscriptionPlan } from "../generated/prisma";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurada");
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
});

// Tipos de período de pagamento
export type PaymentPeriod = "monthly" | "quarterly" | "yearly";

// Mapeamento de planos para preços do Stripe
// IMPORTANTE: Você precisa criar esses produtos/preços no Stripe Dashboard
// e substituir os IDs abaixo pelos IDs reais
// Estrutura: plan[period] = { priceId, amount }
export const STRIPE_PLANS: Record<
  SubscriptionPlan,
  {
    name: string;
    limits: {
      maxClans: number;
      maxInvites: number;
    };
    prices: Record<
      PaymentPeriod,
      {
        priceId: string; // ID do preço no Stripe (ex: price_xxx)
        amount: number; // Valor em centavos
        originalAmount?: number; // Valor original (para mostrar desconto)
      }
    >;
  }
> = {
  MESTRE: {
    name: "Mestre",
    limits: {
      maxClans: 1,
      maxInvites: 1,
    },
    prices: {
      monthly: {
        priceId: env.STRIPE_PRICE_MESTRE_MONTHLY,
        amount: 2990, // R$ 29,90 em centavos
      },
      quarterly: {
        priceId: env.STRIPE_PRICE_MESTRE_QUARTERLY,
        amount: 8073, // R$ 80,73 (R$ 26,91/mês) - 10% desconto
        originalAmount: 8970, // R$ 89,70 (R$ 29,90 x 3)
      },
      yearly: {
        priceId: env.STRIPE_PRICE_MESTRE_YEARLY,
        amount: 28704, // R$ 287,04 (R$ 23,92/mês) - 20% desconto
        originalAmount: 35880, // R$ 358,80 (R$ 29,90 x 12)
      },
    },
  },
  CAMPEAO: {
    name: "Campeão",
    limits: {
      maxClans: 2,
      maxInvites: 2,
    },
    prices: {
      monthly: {
        priceId: env.STRIPE_PRICE_CAMPEAO_MONTHLY,
        amount: 4590, // R$ 45,90 em centavos
      },
      quarterly: {
        priceId: env.STRIPE_PRICE_CAMPEAO_QUARTERLY,
        amount: 12393, // R$ 123,93 (R$ 41,31/mês) - 10% desconto
        originalAmount: 13770, // R$ 137,70 (R$ 45,90 x 3)
      },
      yearly: {
        priceId: env.STRIPE_PRICE_CAMPEAO_YEARLY,
        amount: 44064, // R$ 440,64 (R$ 36,72/mês) - 20% desconto
        originalAmount: 55080, // R$ 550,80 (R$ 45,90 x 12)
      },
    },
  },
  TITA: {
    name: "Titã",
    limits: {
      maxClans: 3,
      maxInvites: 3,
    },
    prices: {
      monthly: {
        priceId: env.STRIPE_PRICE_TITA_MONTHLY,
        amount: 7490, // R$ 74,90 em centavos
      },
      quarterly: {
        priceId: env.STRIPE_PRICE_TITA_QUARTERLY,
        amount: 20223, // R$ 202,23 (R$ 67,41/mês) - 10% desconto
        originalAmount: 22470, // R$ 224,70 (R$ 74,90 x 3)
      },
      yearly: {
        priceId: env.STRIPE_PRICE_TITA_YEARLY,
        amount: 71904, // R$ 719,04 (R$ 59,92/mês) - 20% desconto
        originalAmount: 89880, // R$ 898,80 (R$ 74,90 x 12)
      },
    },
  },
  LEGEND: {
    name: "Legend",
    limits: {
      maxClans: 5,
      maxInvites: 5,
    },
    prices: {
      monthly: {
        priceId: env.STRIPE_PRICE_LEGEND_MONTHLY,
        amount: 11990,
      },
      quarterly: {
        priceId: env.STRIPE_PRICE_LEGEND_QUARTERLY,

        amount: 32373,
        originalAmount: 35970,
      },
      yearly: {
        priceId: env.STRIPE_PRICE_LEGEND_YEARLY,
        amount: 115104,
        originalAmount: 143880,
      },
    },
  },
};

export class StripeService {
  /**
   * Cria uma sessão de checkout para assinatura
   * Agora aceita dados da organização para criar após pagamento confirmado
   */
  async createCheckoutSession(
    organizationData: {
      name: string;
      slug: string;
      plan: SubscriptionPlan;
    },
    period: PaymentPeriod,
    userId: string,
    userEmail: string,
  ): Promise<Stripe.Checkout.Session> {
    const planConfig = STRIPE_PLANS[organizationData.plan];
    const priceConfig = planConfig.prices[period];
    const trialDays = 3;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: priceConfig.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          organizationName: organizationData.name,
          organizationSlug: organizationData.slug,
          userId,
          plan: organizationData.plan,
          period,
        },
      },
      metadata: {
        organizationName: organizationData.name,
        organizationSlug: organizationData.slug,
        userId,
        plan: organizationData.plan,
        period,
      },
      success_url: `${env.BETTER_AUTH_TRUSTED_ORIGIN || "http://localhost:3001"}/organizations/callback?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.BETTER_AUTH_TRUSTED_ORIGIN || "http://localhost:3001"}/org/new?canceled=true`,
    });

    return session;
  }

  /**
   * Cria um portal de gerenciamento de assinatura
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  }

  /**
   * Busca uma subscription do Stripe
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancela uma subscription no Stripe
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  }

  /**
   * Processa webhook do Stripe
   */
  async handleWebhook(
    payload: string | Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error("❌ STRIPE_WEBHOOK_SECRET não configurada");
      throw new Error("STRIPE_WEBHOOK_SECRET não configurada");
    }

    try {
      // Usa constructEventAsync para suportar contextos assíncronos (Bun/Node.js)
      return await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ Erro ao construir evento do webhook:", errorMessage);
      throw error;
    }
  }

  /**
   * Busca uma sessão de checkout
   */
  async getCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.retrieve(sessionId);
  }
}
