import { Elysia, t } from "elysia";
import { ClansController } from "../controllers/clans.controller";
import { ClashOfClansService } from "../services/clash-of-clans.service";
import { ClanService } from "../services/clan.service";
import { ClanRepository } from "../repositories/clan.repository";

const clanRepository = new ClanRepository();
const clashOfClansService = new ClashOfClansService();
const clanService = new ClanService(clanRepository, clashOfClansService);
const clansController = new ClansController(clanService);

export const clansRoutes = new Elysia({ prefix: "/clans" })
  .get(
    "/ranking",
    async (context) => clansController.getPublicRanking(context),
    { detail: { tags: ["Clans"], summary: "Ranking público de clans" } }
  )
  .get(
    "/my",
    async (context) => clansController.getMyClan(context),
    { detail: { tags: ["Clans"], summary: "Listar meus clans" } }
  )
  .get(
    "/tag/:tag",
    async (context) => clansController.getClanByTag(context),
    {
      params: t.Object({ tag: t.String() }),
      detail: { tags: ["Clans"], summary: "Buscar clan por tag (sem #)" },
    }
  )
  .get(
    "/search/:tag",
    async (context) => clansController.searchClan(context),
    {
      params: t.Object({ tag: t.String() }),
      detail: { tags: ["Clans"], summary: "Buscar clan na API do CoC" },
    }
  )
  .post(
    "/create",
    async (context) => clansController.createClan(context),
    {
      body: t.Object({
        clanTag: t.String(),
        clanData: t.Object({
          name: t.String(),
          description: t.Optional(t.String()),
          badgeUrls: t.Optional(t.Object({
            small: t.Optional(t.String()),
            medium: t.Optional(t.String()),
            large: t.Optional(t.String()),
          })),
          clanLevel: t.Optional(t.Number()),
          clanPoints: t.Optional(t.Number()),
          members: t.Optional(t.Number()),
          location: t.Optional(t.Any()),
          warFrequency: t.Optional(t.String()),
          warWins: t.Optional(t.Number()),
          warLosses: t.Optional(t.Number()),
          warTies: t.Optional(t.Number()),
          warWinStreak: t.Optional(t.Number()),
          requiredTrophies: t.Optional(t.Number()),
        }),
      }),
      detail: { tags: ["Clans"], summary: "Criar clan" },
    }
  )
  .delete(
    "/:id",
    async (context) => clansController.removeClan(context),
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Clans"], summary: "Remover clan" },
    }
  );
