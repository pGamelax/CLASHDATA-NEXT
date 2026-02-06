import { Elysia, t } from "elysia";
import { ClansController } from "../controllers/clans.controller";
import { ClashOfClansService } from "../services/clash-of-clans.service";
import { ClanService } from "../services/clan.service";
import { ClanRepository } from "../repositories/clan.repository";
import { OrganizationRepository } from "../repositories/organization.repository";

// Inicializa dependências
const organizationRepository = new OrganizationRepository();
const clanRepository = new ClanRepository();
const clashOfClansService = new ClashOfClansService();
const clanService = new ClanService(
  clanRepository,
  organizationRepository,
  clashOfClansService
);
const clansController = new ClansController(clashOfClansService, clanService);

export const clansRoutes = new Elysia({ prefix: "/clans" })
  .get(
    "/search/:tag",
    async (context) => await clansController.searchClan(context),
    {
      params: t.Object({
        tag: t.String(),
      }),
      detail: {
        tags: ["Clans"],
        summary: "Buscar dados de um clan",
        description: "Busca informações de um clan do Clash of Clans pela tag",
      },
    }
  )
  .post(
    "/create",
    async (context) => await clansController.createClan(context),
    {
      body: t.Object({
        organizationId: t.String(),
        clanTag: t.String(),
        clanData: t.Object({
          name: t.String(),
          description: t.String(),
          badgeUrls: t.Object({
            small: t.String(),
            medium: t.String(),
            large: t.String(),
          }),
          clanLevel: t.Number(),
          clanPoints: t.Number(),
          members: t.Number(),
          location: t.Object({
            id: t.Number(),
            name: t.String(),
            isCountry: t.Boolean(),
            countryCode: t.String(),
          }),
        }),
      }),
      detail: {
        tags: ["Clans"],
        summary: "Criar clan em uma organização",
        description: "Cria um clan dentro de uma organização existente",
      },
    }
  )
  .get(
    "/organization/:organizationId",
    async (context) => await clansController.getClansByOrganization(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      detail: {
        tags: ["Clans"],
        summary: "Listar clans de uma organização",
        description: "Retorna todos os clans de uma organização",
      },
    }
  )
  .delete(
    "/:id",
    async (context) => await clansController.removeClan(context),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Clans"],
        summary: "Remover clan",
        description: "Remove um clan de uma organização. Apenas o dono pode remover.",
      },
    }
  );

