import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import { env } from "./env";
import { betterAuthPlugin, OpenAPI } from "./http/plugins/betterAuthPlugin";
import { clansRoutes } from "./routes/clans.routes";
import { organizationsRoutes } from "./routes/organizations.routes";
import { subscriptionsRoutes } from "./routes/subscriptions.routes";
import { pixRoutes, pixWebhookRoute } from "./routes/pix.routes";
import { adminRoutes } from "./routes/admin.routes";
import { invitesRoutes } from "./routes/invites.routes";
import { membersRoutes } from "./routes/members.routes";
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


const subscriptionRepository = new SubscriptionRepository();
const organizationRepository = new OrganizationRepository();
const subscriptionService = new SubscriptionService(subscriptionRepository);
const organizationService = new OrganizationService(
  organizationRepository,
  subscriptionService
);

const app = new Elysia()
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
  .use(pixWebhookRoute)
  .use(pixRoutes)
  .use(clansRoutes)
  .use(warsRoutes)
  .use(cwlRoutes)
  .use(currentWarRoutes)
  .use(currentCWLRoutes)
  .use(playerPushLogsRoutes)
  .use(playerRoutes)
  .use(seasonEndDateRoutes)
  .get("/health", ({ request }) => {
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "unknown";
    console.log(`[health] ping from ${ip} at ${new Date().toISOString()}`);
    return { status: "healthy", timestamp: new Date().toISOString() };
  })
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

