import { Elysia, t } from "elysia";
import { StripeController } from "../controllers/stripe.controller";
import { StripeService } from "../services/stripe.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { OrganizationService } from "../services/organization.service";
import { OrganizationRepository } from "../repositories/organization.repository";
import { SubscriptionService } from "../services/subscription.service";

// Inicializa dependências
const stripeService = new StripeService();
const subscriptionRepository = new SubscriptionRepository();
const organizationRepository = new OrganizationRepository();
const subscriptionService = new SubscriptionService(subscriptionRepository);
const organizationService = new OrganizationService(
  organizationRepository,
  subscriptionService
);
const stripeController = new StripeController(
  stripeService,
  subscriptionRepository,
  organizationService
);

// Rota do webhook separada - precisa do body raw sem processamento
// O body raw é capturado no onRequest global do app principal
export const stripeWebhookRoute = new Elysia({ prefix: "/stripe" })
  .onError(({ code, error, set, request }: any) => {
    // Captura erros de validação/parse e retorna o resultado do webhook processado
    if ((code === "VALIDATION" || code === "PARSE") && 
        request.method === "POST" && 
        new URL(request.url).pathname === "/stripe/webhook") {
      console.log(`⚠️  Erro de validação/parse ignorado para webhook - retornando resultado processado`);
      // Retorna o resultado do webhook já processado no onRequest global
      set.status = 200;
      const webhookResult = (set as any).webhookResult;
      if (webhookResult) {
        return webhookResult;
      }
      // Se não foi processado ainda, retorna sucesso genérico
      return { received: true, ignored: true };
    }
  })
  .post(
    "/webhook",
    async (context: any) => {
      // Se o webhook já foi processado no onRequest global, retorna o resultado
      if ((context.set as any).webhookProcessed) {
        return (context.set as any).webhookResult || { received: true };
      }
      
      // Fallback: processa aqui se não foi processado no onRequest
      try {
        const rawBody = (context.set as any).rawBody as string | undefined;
        
        if (!rawBody) {
          console.warn("⚠️  Webhook recebido sem body");
          return { received: true, error: "Empty body" };
        }

        const signature = context.request.headers.get("stripe-signature");
        const result = await stripeController.handleWebhook({
          ...context,
          body: rawBody,
        });
        
        return result || { received: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("❌ Erro no webhook route:", message);
        return { received: true, error: message };
      }
    },
    {
      // Não especificamos body - isso evita que o Elysia processe o body
      // O body foi capturado no onRequest global
      detail: {
        tags: ["Stripe"],
        summary: "Webhook do Stripe",
        description:
          "Endpoint para receber webhooks do Stripe. Processa eventos de pagamento e subscription.",
      },
    }
  );

export const stripeRoutes = new Elysia({ prefix: "/stripe" })
  .post(
    "/create-checkout-session",
    async (context) => await stripeController.createCheckoutSession(context),
    {
      body: t.Object({
        name: t.String(),
        slug: t.String(),
        plan: t.Union([
          t.Literal("MESTRE"),
          t.Literal("CAMPEAO"),
          t.Literal("TITA"),
        ]),
        period: t.Union([
          t.Literal("monthly"),
          t.Literal("quarterly"),
          t.Literal("yearly"),
        ]),
      }),
      detail: {
        tags: ["Stripe"],
        summary: "Criar sessão de checkout",
        description:
          "Cria uma sessão de checkout do Stripe para assinatura. A organização será criada apenas após confirmação do pagamento via webhook.",
      },
    }
  )
  .post(
    "/create-portal-session",
    async (context) => await stripeController.createPortalSession(context),
    {
      body: t.Object({
        organizationId: t.String(),
      }),
      detail: {
        tags: ["Stripe"],
        summary: "Criar sessão do portal",
        description:
          "Cria uma sessão do portal de gerenciamento do Stripe. Apenas o dono pode acessar.",
      },
    }
  )
  .get(
    "/checkout-session",
    async (context) => {
      const { StripeService } = await import("../services/stripe.service");
      const service = new StripeService();
      const sessionId = (context.query as any)?.session_id as string;
      
      if (!sessionId) {
        return context.status(400, { message: "session_id é obrigatório" });
      }

      const session = await service.getCheckoutSession(sessionId);
      return {
        success: true,
        payment_status: session.payment_status,
        subscription: session.subscription,
      };
    },
    {
      query: t.Object({
        session_id: t.String(),
      }),
      detail: {
        tags: ["Stripe"],
        summary: "Verificar status do checkout",
        description: "Verifica o status de uma sessão de checkout do Stripe.",
      },
    }
  );
