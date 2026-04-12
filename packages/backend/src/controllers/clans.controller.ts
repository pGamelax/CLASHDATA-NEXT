import { ClanService } from "../services/clan.service";
import { ClashOfClansService } from "../services/clash-of-clans.service";
import { auth } from "../auth";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class ClansController {
  constructor(private clanService: ClanService) {}

  async createClan(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { clanTag, clanData } = body as { clanTag: string; clanData: any };
      if (!clanTag) return status(400, { message: "clanTag é obrigatório" });

      const clan = await this.clanService.createClan(session.user.id, clanTag, clanData);
      return { success: true, data: clan };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  async getMyClan(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const clans = await this.clanService.getClansByOwner(session.user.id);
      return { success: true, data: clans };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  async getClanByTag(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const tag = "#" + (params?.tag ?? "").toUpperCase();
      const { ClanRepository } = await import("../repositories/clan.repository");
      const repo = new ClanRepository();
      const clan = await repo.findByTag(tag);

      if (!clan) return status(404, { message: "Clan não encontrado" });

      const access = await this.clanService.canUserAccessClan(session.user.id, clan.id);
      if (!access.canAccess) return status(403, { message: access.reason });

      return { success: true, data: clan };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  async searchClan(context: ElysiaContext) {
    const { params, status } = context;
    try {
      const tag = params?.tag;
      if (!tag) return status(400, { message: "Tag é obrigatória" });

      const clashService = new ClashOfClansService();
      const clanData = await clashService.searchClanByTag(
        tag.startsWith("#") ? tag : `#${tag}`
      );
      return { success: true, data: clanData };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  async removeClan(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const clanId = params?.id;
      if (!clanId) return status(400, { message: "ID do clan é obrigatório" });

      const result = await this.clanService.removeClan(clanId, session.user.id);
      return { success: true, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  async getPublicRanking(context: ElysiaContext) {
    const { status } = context;
    try {
      const ranking = await this.clanService.getPublicRanking();
      return { success: true, data: ranking };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }
}
