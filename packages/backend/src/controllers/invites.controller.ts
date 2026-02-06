import { InviteService } from "../services/invite.service";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class InvitesController {
  constructor(private inviteService: InviteService) {}

  async sendInvite(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId, userId } = body as {
        organizationId: string;
        userId: string;
      };

      const invite = await this.inviteService.sendInvite(
        organizationId,
        userId,
        session.user.id
      );

      return {
        success: true,
        invite,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao enviar convite:", error);

      if (
        message.includes("já é membro") ||
        message.includes("já existe um convite") ||
        message.includes("não encontrado") ||
        message.includes("não encontrada") ||
        message.includes("pode enviar convites") ||
        message.includes("Limite")
      ) {
        return status(400, { message });
      }

      return status(500, { message });
    }
  }

  async acceptInvite(context: ElysiaContext) {
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

      const invite = await this.inviteService.acceptInvite(
        id,
        session.user.id
      );

      return {
        success: true,
        invite,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao aceitar convite:", error);

      if (
        message.includes("não encontrado") ||
        message.includes("não é para você") ||
        message.includes("já foi processado") ||
        message.includes("expirou")
      ) {
        return status(400, { message });
      }

      return status(500, { message });
    }
  }

  async rejectInvite(context: ElysiaContext) {
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

      const invite = await this.inviteService.rejectInvite(
        id,
        session.user.id
      );

      return {
        success: true,
        invite,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao rejeitar convite:", error);

      if (
        message.includes("não encontrado") ||
        message.includes("não é para você") ||
        message.includes("já foi processado")
      ) {
        return status(400, { message });
      }

      return status(500, { message });
    }
  }

  async cancelInvite(context: ElysiaContext) {
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

      const invite = await this.inviteService.cancelInvite(
        id,
        session.user.id
      );

      return {
        success: true,
        invite,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao cancelar convite:", error);

      if (
        message.includes("não encontrado") ||
        message.includes("pode cancelar") ||
        message.includes("podem ser cancelados")
      ) {
        return status(400, { message });
      }

      return status(500, { message });
    }
  }

  async getInvitesByOrganization(context: ElysiaContext) {
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

      const invites = await this.inviteService.getInvitesByOrganization(
        organizationId
      );

      return {
        success: true,
        data: invites,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar convites:", error);
      return status(500, { message });
    }
  }

  async getPendingInvites(context: ElysiaContext) {
    const { request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const invites = await this.inviteService.getPendingInvitesByUser(
        session.user.id
      );

      return {
        success: true,
        data: invites,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar convites pendentes:", error);
      return status(500, { message });
    }
  }

  async searchUsers(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { email } = body as { email: string };

      if (!email || email.trim().length < 3) {
        return status(400, { message: "Email deve ter pelo menos 3 caracteres" });
      }

      // Busca usuários por email (parcial)
      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: email.trim(),
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        take: 10,
      });

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar usuários:", error);
      return status(500, { message });
    }
  }
}
