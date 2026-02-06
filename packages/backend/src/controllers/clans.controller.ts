import { ClashOfClansService } from "../services/clash-of-clans.service";
import { ClanService } from "../services/clan.service";
import { auth } from "../auth";

type ElysiaContext = {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class ClansController {
  constructor(
    private clashOfClansService: ClashOfClansService,
    private clanService: ClanService
  ) {}

  async searchClan(context: ElysiaContext) {
    const { params, status } = context;
    try {
      const { tag } = params as { tag: string };
      const clanData = await this.clashOfClansService.searchClanByTag(tag);
      return clanData;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (message === "Clan não encontrado") {
        return status(404, { message });
      }

      console.error("Erro ao buscar clan:", error);
      return status(500, { message });
    }
  }

  async createClan(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId, clanTag, clanData } = body as {
        organizationId: string;
        clanTag: string;
        clanData: any;
      };

      const clan = await this.clanService.createClanInOrganization(
        organizationId,
        clanTag,
        clanData,
        session.user.id
      );

      return {
        success: true,
        clan,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (
        message.includes("já existe") ||
        message.includes("já está cadastrado") ||
        message.includes("não encontrada") ||
        message.includes("não encontrado")
      ) {
        return status(409, { message });
      }

      console.error("Erro ao criar clan:", error);
      return status(500, { message });
    }
  }

  async getClansByOrganization(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId } = params as { organizationId: string };

      const clans = await this.clanService.getClansByOrganization(
        organizationId
      );

      return {
        success: true,
        data: clans,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (message.includes("não encontrada")) {
        return status(404, { message });
      }

      console.error("Erro ao buscar clans:", error);
      return status(500, { message });
    }
  }

  async removeClan(context: ElysiaContext) {
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

      await this.clanService.removeClan(id, session.user.id);

      return {
        success: true,
        message: "Clan removido com sucesso",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (message.includes("não encontrado") || message.includes("não encontrada")) {
        return status(404, { message });
      }
      if (message.includes("Apenas o dono")) {
        return status(403, { message });
      }

      console.error("Erro ao remover clan:", error);
      return status(500, { message });
    }
  }
}

