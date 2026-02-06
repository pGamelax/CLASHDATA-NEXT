import { MemberService } from "../services/member.service";
import { auth } from "../auth";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class MembersController {
  constructor(private memberService: MemberService) {}

  async removeMember(context: ElysiaContext) {
    const { params, body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId } = params as { organizationId: string };
      const { userId } = body as { userId: string };

      await this.memberService.removeMember(
        organizationId,
        userId,
        session.user.id
      );

      return {
        success: true,
        message: "Membro removido com sucesso",
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

      console.error("Erro ao remover membro:", error);
      return status(500, { message });
    }
  }
}
