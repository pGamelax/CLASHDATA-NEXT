import { Elysia, t } from "elysia";
import { InvitesController } from "../controllers/invites.controller";
import { InviteRepository } from "../repositories/invite.repository";
import { InviteService } from "../services/invite.service";
import { OrganizationRepository } from "../repositories/organization.repository";

// Inicializa dependências
const inviteRepository = new InviteRepository();
const organizationRepository = new OrganizationRepository();
const inviteService = new InviteService(inviteRepository, organizationRepository);
const invitesController = new InvitesController(inviteService);

export const invitesRoutes = new Elysia({ prefix: "/invites" })
  .post(
    "/send",
    async (context) => await invitesController.sendInvite(context),
    {
      body: t.Object({
        organizationId: t.String(),
        userId: t.String(),
      }),
      detail: {
        tags: ["Invites"],
        summary: "Enviar convite",
        description:
          "Envia um convite para um usuário. Apenas o dono da organização pode enviar convites.",
      },
    }
  )
  .post(
    "/:id/accept",
    async (context) => await invitesController.acceptInvite(context),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Invites"],
        summary: "Aceitar convite",
        description: "Aceita um convite pendente.",
      },
    }
  )
  .post(
    "/:id/reject",
    async (context) => await invitesController.rejectInvite(context),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Invites"],
        summary: "Rejeitar convite",
        description: "Rejeita um convite pendente.",
      },
    }
  )
  .delete(
    "/:id",
    async (context) => await invitesController.cancelInvite(context),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Invites"],
        summary: "Cancelar convite",
        description:
          "Cancela um convite pendente. Apenas o dono da organização pode cancelar.",
      },
    }
  )
  .get(
    "/organization/:organizationId",
    async (context) =>
      await invitesController.getInvitesByOrganization(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      detail: {
        tags: ["Invites"],
        summary: "Listar convites da organização",
        description: "Lista todos os convites de uma organização.",
      },
    }
  )
  .get(
    "/pending",
    async (context) => await invitesController.getPendingInvites(context),
    {
      detail: {
        tags: ["Invites"],
        summary: "Listar convites pendentes",
        description: "Lista todos os convites pendentes do usuário autenticado.",
      },
    }
  )
  .post(
    "/search-users",
    async (context) => await invitesController.searchUsers(context),
    {
      body: t.Object({
        email: t.String(),
      }),
      detail: {
        tags: ["Invites"],
        summary: "Buscar usuários por email",
        description: "Busca usuários por email (parcial).",
      },
    }
  );
