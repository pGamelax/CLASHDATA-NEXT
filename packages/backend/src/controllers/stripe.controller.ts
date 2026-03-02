import { StripeService } from "../services/stripe.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { OrganizationService } from "../services/organization.service";
import { SubscriptionService } from "../services/subscription.service";
import { auth } from "../auth";
import { SubscriptionStatus } from "../generated/prisma";
import Stripe from "stripe";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class StripeController {
  constructor(
    private stripeService: StripeService,
    private subscriptionRepository: SubscriptionRepository,
    private organizationService: OrganizationService
  ) {}

  /**
   * Cria uma sessão de checkout
   * Agora aceita dados da organização para criar após pagamento confirmado
   */
  async createCheckoutSession(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { name, slug, plan, period } = body as {
        name: string;
        slug: string;
        plan: string;
        period: "monthly" | "quarterly" | "yearly";
      };

      // Valida os dados
      if (!name || !slug) {
        return status(400, {
          message: "Nome e slug da organização são obrigatórios",
        });
      }

      if (!plan || !["MESTRE", "CAMPEAO", "TITA", "LEGEND"].includes(plan)) {
        return status(400, {
          message: "Plano inválido. Deve ser MESTRE, CAMPEAO, TITA ou LEGEND",
        });
      }

      if (!period || !["monthly", "quarterly", "yearly"].includes(period)) {
        return status(400, {
          message: "Período inválido. Deve ser monthly, quarterly ou yearly",
        });
      }

      // Verifica se já existe organização com esse slug
      const { OrganizationRepository } = await import(
        "../repositories/organization.repository"
      );
      const organizationRepository = new OrganizationRepository();
      const existingOrg = await organizationRepository.findBySlug(slug);
      if (existingOrg) {
        return status(409, {
          message: "Já existe uma organização com esse slug",
        });
      }

      // Cria a sessão de checkout com dados da organização em metadata
      const checkoutSession = await this.stripeService.createCheckoutSession(
        {
          name,
          slug,
          plan: plan as any,
        },
        period,
        session.user.id,
        session.user.email || ""
      );

      return {
        success: true,
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao criar checkout session:", error);
      return status(500, { message });
    }
  }

  /**
   * Cria uma sessão do portal de gerenciamento
   */
  async createPortalSession(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId } = body as {
        organizationId: string;
      };

      // Verifica se o usuário é owner da organização
      const access = await this.organizationService.canUserAccessOrganization(
        session.user.id,
        organizationId
      );

      if (!access.canAccess || access.role !== "owner") {
        return status(403, {
          message: "Apenas o dono da organização pode acessar o portal",
        });
      }

      // Busca a subscription
      const subscription = await this.subscriptionRepository.findByOrganizationId(
        organizationId
      );

      if (!subscription || !subscription.stripeCustomerId) {
        return status(404, {
          message: "Subscription não encontrada ou sem customer do Stripe",
        });
      }

      // Cria a sessão do portal
      const portalSession = await this.stripeService.createPortalSession(
        subscription.stripeCustomerId,
        `${process.env.BETTER_AUTH_TRUSTED_ORIGIN || "http://localhost:3001"}/organizations/${organizationId}`
      );

      return {
        success: true,
        url: portalSession.url,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao criar portal session:", error);
      return status(500, { message });
    }
  }

  /**
   * Cria uma sessão de checkout para upgrade/change plan
   */
  async createUpgradeCheckoutSession(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId, newPlan, newPeriod } = body as {
        organizationId: string;
        newPlan: string;
        newPeriod: "monthly" | "quarterly" | "yearly";
      };

      // Verifica se o usuário é owner da organização
      const access = await this.organizationService.canUserAccessOrganization(
        session.user.id,
        organizationId
      );

      if (!access.canAccess || access.role !== "owner") {
        return status(403, {
          message: "Apenas o dono da organização pode fazer upgrade",
        });
      }

      // Busca a subscription
      const subscription = await this.subscriptionRepository.findByOrganizationId(
        organizationId
      );

      if (!subscription || !subscription.paymentProviderId) {
        return status(404, {
          message: "Subscription não encontrada ou sem subscription do Stripe",
        });
      }

      // Busca a organização para o returnUrl
      const { OrganizationRepository } = await import(
        "../repositories/organization.repository"
      );
      const organizationRepository = new OrganizationRepository();
      const organization = await organizationRepository.findById(organizationId);

      if (!organization) {
        return status(404, { message: "Organização não encontrada" });
      }

      const returnUrl = `${process.env.BETTER_AUTH_TRUSTED_ORIGIN || "http://localhost:3001"}/org/${organization.slug}/subscription`;

      // Cria a sessão de checkout para upgrade
      const checkoutSession = await this.stripeService.createUpgradeCheckoutSession(
        organizationId,
        subscription.paymentProviderId,
        newPlan as any,
        newPeriod,
        returnUrl
      );

      return {
        success: true,
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao criar upgrade checkout session:", error);
      return status(500, { message });
    }
  }

  /**
   * Faz upgrade/downgrade direto na subscription
   */
  async changeSubscriptionPlan(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId, newPlan, newPeriod } = body as {
        organizationId: string;
        newPlan: string;
        newPeriod: "monthly" | "quarterly" | "yearly";
      };

      // Verifica se o usuário é owner da organização
      const access = await this.organizationService.canUserAccessOrganization(
        session.user.id,
        organizationId
      );

      if (!access.canAccess || access.role !== "owner") {
        return status(403, {
          message: "Apenas o dono da organização pode trocar de plano",
        });
      }

      // Busca a subscription
      const subscription = await this.subscriptionRepository.findByOrganizationId(
        organizationId
      );

      if (!subscription || !subscription.paymentProviderId) {
        return status(404, {
          message: "Subscription não encontrada ou sem subscription do Stripe",
        });
      }

      // Faz o upgrade/downgrade direto
      const updatedSubscription = await this.stripeService.changeSubscriptionPlan(
        subscription.paymentProviderId,
        newPlan as any,
        newPeriod
      );

      // Atualiza a subscription local
      await this.subscriptionRepository.update(organizationId, {
        plan: newPlan as any,
      });

      return {
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao trocar plano:", error);
      return status(500, { message });
    }
  }

  /**
   * Processa webhook do Stripe
   */
  async handleWebhook(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const signature = request.headers.get("stripe-signature");

      if (!signature) {
        console.warn("⚠️  Webhook recebido sem signature header");
        // Retorna 200 para evitar retry, mas loga o problema
        return { received: true, error: "Missing stripe-signature header" };
      }

      // Processa o webhook
      let event: Stripe.Event;
      try {
        event = await this.stripeService.handleWebhook(
          body as string | Buffer,
          signature
        );
      } catch (webhookError) {
        const errorMessage = webhookError instanceof Error ? webhookError.message : "Erro desconhecido";
        console.error("Erro ao validar webhook:", errorMessage);
        
        // Todos os erros de validação retornam 200 para evitar retry infinito
        // Mas logamos para investigação
        console.warn("⚠️  Erro de validação do webhook (retornando 200):", errorMessage);
        return { received: true, error: errorMessage, ignored: true };
      }

      // Processa eventos relevantes
      const supportedEvents = [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
      ];

      if (!supportedEvents.includes(event.type)) {
        // Evento não suportado - retorna 200 para evitar retry do Stripe
        console.log(`⚠️  Evento não suportado ignorado: ${event.type} [${event.id}]`);
        return { received: true, ignored: true, eventType: event.type };
      }

      console.log(`🔄 Processando evento: ${event.type} [${event.id}]`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            await this.handleCheckoutCompleted(session);
            break;
          }

          case "customer.subscription.created":
          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            await this.handleSubscriptionUpdated(subscription);
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await this.handleSubscriptionDeleted(subscription);
            break;
          }

          case "invoice.payment_succeeded": {
            const invoice = event.data.object as Stripe.Invoice;
            await this.handlePaymentSucceeded(invoice);
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            await this.handlePaymentFailed(invoice);
            break;
          }
        }

        console.log(`✅ Webhook processado com sucesso: ${event.type} [${event.id}]`);
        return { received: true, eventType: event.type };
      } catch (handlerError) {
      // Erro ao processar handler específico
      const errorMessage = handlerError instanceof Error ? handlerError.message : "Erro desconhecido";
      const errorStack = handlerError instanceof Error ? handlerError.stack : "N/A";
      console.error(`❌ Erro ao processar handler para ${event.type} [${event.id}]:`, errorMessage);
      console.error("Stack:", errorStack);
      
      // Ainda retorna 200 para evitar retry infinito, mas loga o erro
      return {
        received: true,
        error: errorMessage,
        eventType: event.type,
      };
    }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao processar webhook:", error);
      console.error("Stack:", error instanceof Error ? error.stack : "N/A");
      
      // Todos os erros retornam 200 para evitar retry infinito do Stripe
      // mas logamos para investigação
      console.error("❌ Erro ao processar webhook (retornando 200 para evitar retry):", message);
      if (error instanceof Error && error.stack) {
        console.error("Stack trace completo:", error.stack);
      }
      return { received: true, error: message };
    }
  }

  /**
   * Handler para checkout completado
   * Agora cria a organização quando o pagamento for confirmado
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      const organizationName = session.metadata?.organizationName;
      const organizationSlug = session.metadata?.organizationSlug;
      const plan = session.metadata?.plan;
      const userId = session.metadata?.userId;

      if (!organizationName || !organizationSlug || !plan || !userId) {
        console.warn("Checkout session sem metadata necessária:", {
          hasOrganizationName: !!organizationName,
          hasOrganizationSlug: !!organizationSlug,
          hasPlan: !!plan,
          hasUserId: !!userId,
          sessionId: session.id,
        });
        return;
      }

      // Verifica se a organização já existe (evita duplicação)
      const { OrganizationRepository } = await import(
        "../repositories/organization.repository"
      );
      const organizationRepository = new OrganizationRepository();
      const existingOrg = await organizationRepository.findBySlug(organizationSlug);
      
      let organizationId: string;
      
      if (existingOrg) {
        // Se já existe, usa a existente
        organizationId = existingOrg.id;
        console.log(`Organização já existe: ${organizationId}`);
      } else {
        // Cria a organização com trial
        const result = await this.organizationService.createOrganizationWithTrial(
          userId,
          {
            name: organizationName,
            slug: organizationSlug,
            plan: plan as any,
          }
        );
        organizationId = result.organization.id;
        console.log(`Organização criada: ${organizationId}`);
      }

      // Busca a subscription do Stripe
      if (session.subscription && typeof session.subscription === "string") {
        const stripeSubscription = await this.stripeService.getSubscription(
          session.subscription
        );

        // Atualiza a subscription local com dados do Stripe
        await this.subscriptionRepository.update(organizationId, {
          paymentProviderId: stripeSubscription.id,
          stripeCustomerId: stripeSubscription.customer as string,
          status: SubscriptionStatus.TRIAL, // Ainda está em trial
          trialEndsAt: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : undefined,
          currentPeriodEnd: (stripeSubscription as any).current_period_end
            ? new Date((stripeSubscription as any).current_period_end * 1000)
            : undefined,
        });

        console.log(`Subscription atualizada para organização ${organizationId}`);
      } else {
        console.warn("Checkout session sem subscription:", session.id);
      }
    } catch (error) {
      console.error("Erro ao processar checkout completed:", error);
      throw error; // Re-lança para ser tratado no handler principal
    }
  }

  /**
   * Handler para subscription atualizada
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
      let organizationId = subscription.metadata?.organizationId;

      if (!organizationId) {
        // Se não tem metadata, tenta buscar pela subscription ID no banco
        const { prisma } = await import("../lib/prisma");
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            paymentProviderId: subscription.id,
          },
        });
        
        if (!existingSubscription) {
          // Tenta buscar pelo customer ID
          const byCustomer = await prisma.subscription.findFirst({
            where: {
              stripeCustomerId: subscription.customer as string,
            },
          });
          
          if (!byCustomer) {
            console.warn("Subscription sem metadata e não encontrada no banco:", {
              subscriptionId: subscription.id,
              customerId: subscription.customer,
            });
            return;
          }
          
          organizationId = byCustomer.organizationId;
        } else {
          organizationId = existingSubscription.organizationId;
        }
      }

      await this.updateSubscriptionFromStripe(organizationId, subscription);
    } catch (error) {
      console.error("Erro ao processar subscription updated:", error);
      throw error;
    }
  }

  /**
   * Atualiza subscription baseado nos dados do Stripe
   */
  private async updateSubscriptionFromStripe(
    organizationId: string,
    subscription: Stripe.Subscription
  ) {

    // Determina o status
    let status: SubscriptionStatus = SubscriptionStatus.ACTIVE;
    if (subscription.status === "trialing") {
      status = SubscriptionStatus.TRIAL;
    } else if (subscription.status === "canceled") {
      // Não deletamos mais a organização automaticamente; mantemos status CANCELLED
      status = SubscriptionStatus.CANCELLED;
    } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
      status = SubscriptionStatus.EXPIRED;
    }

    // Atualiza a subscription local
    await this.subscriptionRepository.update(organizationId, {
      status,
      paymentProviderId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
      currentPeriodEnd: (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    });
  }

  /**
   * Handler para subscription deletada
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      let organizationId = subscription.metadata?.organizationId;

      if (!organizationId) {
        // Tenta buscar pelo paymentProviderId
        const { prisma } = await import("../lib/prisma");
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            paymentProviderId: subscription.id,
          },
        });
        
        if (!existingSubscription) {
          console.warn("Subscription deletada sem metadata e não encontrada no banco:", {
            subscriptionId: subscription.id,
          });
          return;
        }
        
        organizationId = existingSubscription.organizationId;
      }

      // Expira a subscription
      await this.subscriptionRepository.expire(organizationId);
      
      // Deleta a organização quando a subscription é deletada
      try {
        // Busca o owner da organização para passar como userId
        const { prisma } = await import("../lib/prisma");
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          include: {
            members: {
              where: { role: "owner" },
              take: 1,
            },
          },
        });
        
        if (org && org.members.length > 0) {
          const ownerId = org.members[0].userId;
          // skipStripeCancel = true porque a subscription já foi deletada no Stripe
          await this.organizationService.deleteOrganization(organizationId, ownerId, true);
          console.log(`Organização ${organizationId} deletada após subscription deletada no Stripe`);
        }
      } catch (error) {
        // Log do erro mas não bloqueia a expiração
        console.error("Erro ao deletar organização após subscription deletada:", error);
      }
      
      console.log(`Subscription expirada para organização ${organizationId}`);
    } catch (error) {
      console.error("Erro ao processar subscription deleted:", error);
      throw error;
    }
  }

  /**
   * Handler para pagamento bem-sucedido
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
      const subscriptionId = (invoice as any).subscription;
      if (subscriptionId && typeof subscriptionId === "string") {
        const subscription = await this.stripeService.getSubscription(
          subscriptionId
        );
        await this.handleSubscriptionUpdated(subscription);
      }
    } catch (error) {
      console.error("Erro ao processar payment succeeded:", error);
      throw error;
    }
  }

  /**
   * Handler para pagamento falhado
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    try {
      const subscriptionId = (invoice as any).subscription;
      if (subscriptionId && typeof subscriptionId === "string") {
        const subscription = await this.stripeService.getSubscription(
          subscriptionId
        );
        let organizationId = subscription.metadata?.organizationId;

        if (!organizationId) {
          // Tenta buscar pelo paymentProviderId
          const { prisma } = await import("../lib/prisma");
          const existingSubscription = await prisma.subscription.findFirst({
            where: {
              paymentProviderId: subscription.id,
            },
          });
          
          if (!existingSubscription) {
            console.warn("Payment failed: subscription não encontrada no banco");
            return;
          }
          
          organizationId = existingSubscription.organizationId;
        }

        // Marca como expirada se o pagamento falhou
        await this.subscriptionRepository.update(organizationId, {
          status: SubscriptionStatus.EXPIRED,
        });
        console.log(`Subscription marcada como expirada para organização ${organizationId}`);
      }
    } catch (error) {
      console.error("Erro ao processar payment failed:", error);
      throw error;
    }
  }
}
