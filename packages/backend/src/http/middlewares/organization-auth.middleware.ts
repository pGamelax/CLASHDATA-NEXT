import { Elysia } from "elysia";
import { auth } from "@/auth";
import { OrganizationService } from "@/services/organization.service";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { SubscriptionService } from "@/services/subscription.service";
import { SubscriptionRepository } from "@/repositories/subscription.repository";

// Instância compartilhada do service
let organizationServiceInstance: OrganizationService | null = null;

function getOrganizationService(): OrganizationService {
  if (!organizationServiceInstance) {
    const organizationRepository = new OrganizationRepository();
    const subscriptionRepository = new SubscriptionRepository();
    const subscriptionService = new SubscriptionService(subscriptionRepository);
    organizationServiceInstance = new OrganizationService(
      organizationRepository,
      subscriptionService
    );
  }
  return organizationServiceInstance;
}

/**
 * Middleware para verificar se o usuário tem acesso à organização
 * Deve ser usado em rotas que requerem acesso a uma organização específica
 * 
 * Uso:
 * .use(organizationAuthMiddleware)
 * .get("/:organizationId/...", handler, {
 *   beforeHandle: async ({ params, request, status }) => {
 *     const orgId = params.organizationId;
 *     const session = await auth.api.getSession({ headers: request.headers });
 *     if (!session?.user) return status(401, { message: "Não autenticado" });
 *     
 *     const service = getOrganizationService();
 *     const access = await service.canUserAccessOrganization(session.user.id, orgId);
 *     if (!access.canAccess) {
 *       return status(403, { message: access.reason || "Acesso negado" });
 *     }
 *   }
 * })
 */
export const organizationAuthMiddleware = new Elysia({ name: "organization-auth" })
  .derive(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    
    return {
      session,
      organizationService: getOrganizationService(),
    };
  });

/**
 * Helper para verificar acesso à organização em rotas
 * Retorna o resultado da verificação ou lança um erro que deve ser tratado
 */
export async function verifyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<{ canAccess: boolean; role?: string; reason?: string }> {
  const service = getOrganizationService();
  return await service.canUserAccessOrganization(userId, organizationId);
}
