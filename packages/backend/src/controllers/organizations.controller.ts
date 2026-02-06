import { OrganizationService } from "../services/organization.service";
import { auth } from "../auth";
import { SubscriptionPlan } from "../generated/prisma";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class OrganizationsController {
  constructor(private organizationService: OrganizationService) {}

  async createOrganization(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { name, slug, plan } = body as {
        name: string;
        slug: string;
        plan?: SubscriptionPlan;
      };

      // Se for admin, pode criar sem plano (sem subscription)
      const isAdmin = session.user.role === "admin";
      
      if (!isAdmin) {
        // Valida o plano para usuários normais
        if (!plan || !["MESTRE", "CAMPEAO", "TITA"].includes(plan)) {
          return status(400, {
            message: "Plano inválido. Deve ser MESTRE, CAMPEAO ou TITA",
          });
        }

        // Usuários normais devem usar o fluxo do Stripe
        return status(400, {
          message: "Usuários normais devem criar organização através do checkout do Stripe",
        });
      }

      // Admin cria organização sem subscription
      const result = await this.organizationService.createOrganizationWithoutSubscription(
        session.user.id,
        {
          name,
          slug,
        }
      );

      return {
        success: true,
        organization: result.organization,
        subscription: null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao criar organização:", error);

      // Trata erros específicos
      if (message.includes("já existe")) {
        return status(409, { message });
      }
      if (message.includes("não é possível criar")) {
        return status(403, { message });
      }

      return status(500, { message });
    }
  }

  async getOrganization(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { id } = params as { id: string };

      // Verifica se o usuário tem acesso
      const access = await this.organizationService.canUserAccessOrganization(
        session.user.id,
        id
      );

      if (!access.canAccess) {
        return status(403, { message: access.reason || "Acesso negado" });
      }

      // Busca a organização
      const { OrganizationRepository } = await import(
        "../repositories/organization.repository"
      );
      const organizationRepository = new OrganizationRepository();
      const organization = await organizationRepository.findByIdOrSlug(id);

      if (!organization) {
        return status(404, { message: "Organização não encontrada" });
      }

      return {
        success: true,
        organization,
        userRole: access.role,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar organização:", error);
      return status(500, { message });
    }
  }

  async listOrganizations(context: ElysiaContext) {
    const { request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      // Busca organizações do usuário com subscriptions
      const { OrganizationRepository } = await import(
        "../repositories/organization.repository"
      );
      const organizationRepository = new OrganizationRepository();
      const organizations = await organizationRepository.findByUserId(session.user.id);

      return {
        success: true,
        data: organizations,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao listar organizações:", error);
      return status(500, { message });
    }
  }

  async updateOrganization(context: ElysiaContext) {
    const { params, body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { id } = params as { id: string };
      const { name, slug } = body as { name?: string; slug?: string };

      const organization = await this.organizationService.updateOrganization(
        id,
        session.user.id,
        { name, slug }
      );

      return {
        success: true,
        organization,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (message.includes("não encontrada") || message.includes("não encontrado")) {
        return status(404, { message });
      }
      if (message.includes("já existe")) {
        return status(409, { message });
      }
      if (message.includes("Apenas o dono")) {
        return status(403, { message });
      }

      console.error("Erro ao atualizar organização:", error);
      return status(500, { message });
    }
  }

  async deleteOrganization(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { id } = params as { id: string };

      await this.organizationService.deleteOrganization(id, session.user.id);

      return {
        success: true,
        message: "Organização deletada com sucesso",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (message.includes("não encontrada") || message.includes("não encontrado")) {
        return status(404, { message });
      }
      if (message.includes("Apenas o dono")) {
        return status(403, { message });
      }

      console.error("Erro ao deletar organização:", error);
      return status(500, { message });
    }
  }
}

