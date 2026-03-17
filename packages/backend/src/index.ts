import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import { env } from "./env";
import { betterAuthPlugin, OpenAPI } from "./http/plugins/betterAuthPlugin";
import { clansRoutes } from "./routes/clans.routes";
import { organizationsRoutes } from "./routes/organizations.routes";
import { subscriptionsRoutes } from "./routes/subscriptions.routes";
import { stripeRoutes, stripeWebhookRoute } from "./routes/stripe.routes";
import { adminRoutes } from "./routes/admin.routes";
import { invitesRoutes } from "./routes/invites.routes";
import { membersRoutes } from "./routes/members.routes";
import { StripeController } from "./controllers/stripe.controller";
import { StripeService } from "./services/stripe.service";
import { SubscriptionRepository } from "./repositories/subscription.repository";
import { OrganizationService } from "./services/organization.service";
import { OrganizationRepository } from "./repositories/organization.repository";
import { SubscriptionService } from "./services/subscription.service";
import { warsRoutes } from "./routes/wars.routes";
import { cwlRoutes } from "./routes/cwl.routes";
import { currentWarRoutes } from "./routes/current-war.routes";
import { currentCWLRoutes } from "./routes/current-cwl.routes";
import { playerPushLogsRoutes } from "./routes/player-push-logs.routes";
import { playerRoutes } from "./routes/player.routes";
import { setupPlayerPushJob, playerPushWorker } from "./jobs/player-push.job";
import { setupSubscriptionExpiryJob, subscriptionExpiryWorker } from "./jobs/subscription-expiry.job";
import { seasonEndDateRoutes } from "./routes/season-end-date.routes";
import { seasonSnapshotWorker } from "./jobs/season-snapshot.job";

const corsOrigin = env.CORS_ORIGIN || env.BETTER_AUTH_TRUSTED_ORIGIN;
const originArray = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];

const baseURL = env.BETTER_AUTH_BASE_URL || 
  (Array.isArray(env.BETTER_AUTH_TRUSTED_ORIGIN) 
    ? env.BETTER_AUTH_TRUSTED_ORIGIN[0] 
    : env.BETTER_AUTH_TRUSTED_ORIGIN);


// Inicializa dependências do Stripe para processar webhooks
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

const app = new Elysia()
  .onRequest(async ({ request, set }) => {
    // Intercepta requisições para /stripe/webhook ANTES de qualquer processamento
    if (request.method === "POST" && new URL(request.url).pathname === "/stripe/webhook") {
      try {
        // Captura o body raw ANTES de qualquer processamento do Elysia
        const rawBody = await request.text();
        (set as any).rawBody = rawBody;
        
        if (rawBody) {
          const signature = request.headers.get("stripe-signature");
          
          try {
            const result = await stripeController.handleWebhook({
              request,
              body: rawBody,
              status: (code: number, data?: any) => ({ status: code, data }),
            } as any);
            
            (set as any).webhookProcessed = true;
            (set as any).webhookResult = result || { received: true };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido";
            (set as any).webhookProcessed = true;
            (set as any).webhookResult = { received: true, error: message };
          }
        }
      } catch (error) {
        (set as any).rawBody = "";
        (set as any).webhookProcessed = true;
        (set as any).webhookResult = { received: true, error: "Failed to read body" };
      }
    }
  })
  .use(
    cors({
      origin: originArray.length === 1 ? originArray[0] : originArray,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    })
  )
  .use(betterAuthPlugin)
  .use(adminRoutes)
  .use(organizationsRoutes)
  .use(subscriptionsRoutes)
  .use(invitesRoutes)
  .use(membersRoutes)
  .use(stripeWebhookRoute) // Webhook deve ser montado ANTES para capturar body raw
  .use(stripeRoutes)
  .use(clansRoutes)
  .use(warsRoutes)
  .use(cwlRoutes)
  .use(currentWarRoutes)
  .use(currentCWLRoutes)
  .use(playerPushLogsRoutes)
  .use(playerRoutes)
  .use(seasonEndDateRoutes)
  .get("/health", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
  }))
  .listen(Number(env.PORT));

console.log(
  `🦊 Backend rodando em http://${app.server?.hostname}:${app.server?.port}`
);

// Inicializar job de player push
setupPlayerPushJob().catch((error) => {
  console.error("Erro ao configurar job de player push:", error);
});

// Inicializar job de expiração de subscriptions
setupSubscriptionExpiryJob().catch((error) => {
  console.error("Erro ao configurar job de expiração de subscriptions:", error);
});

playerPushWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} falhou:`, err.message);
});

playerPushWorker.on("error", (error) => {
  console.error("Erro no worker:", error);
});

subscriptionExpiryWorker.on("failed", (job, err) => {
  console.error(`Job de expiração ${job?.id} falhou:`, err.message);
});

seasonSnapshotWorker.on("completed", (job) => {
  console.log(`[SeasonSnapshot] Job ${job.id} concluído.`);
});

seasonSnapshotWorker.on("failed", (job, err) => {
  console.error(`[SeasonSnapshot] Job ${job?.id} falhou:`, err.message);
});

export type App = typeof app;

