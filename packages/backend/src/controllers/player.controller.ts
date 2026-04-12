import { PlayerService } from "../services/player.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { SubscriptionService } from "../services/subscription.service";
import { auth } from "../auth";

type ElysiaContext = {
  params?: Record<string, string>;
  query?: Record<string, string>;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class PlayerController {
  private playerService: PlayerService;
  private subscriptionRepository: SubscriptionRepository;
  private subscriptionService: SubscriptionService;

  constructor() {
    this.playerService = new PlayerService();
    this.subscriptionRepository = new SubscriptionRepository();
    this.subscriptionService = new SubscriptionService(this.subscriptionRepository);
  }

  /**
   * Verifica se o usuário tem assinatura ativa em algum clan que é dono
   */
  private async hasActiveSubscription(userId: string): Promise<boolean> {
    const { prisma } = await import("../lib/prisma");
    const clans = await prisma.clan.findMany({
      where: { ownerId: userId },
      include: { subscription: true },
    });

    for (const clan of clans) {
      if (clan.subscription) {
        const isActive = this.subscriptionService.isSubscriptionActive(clan.subscription);
        if (isActive) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Busca dados completos do jogador
   */
  async getPlayer(context: ElysiaContext) {
    const { params, request, status: statusFn } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return statusFn(401, { message: "Não autenticado" });
      }

      // Verifica se tem assinatura ativa
      const hasActive = await this.hasActiveSubscription(session.user.id);
      if (!hasActive) {
        return statusFn(403, {
          message: "Você precisa ter uma assinatura ativa para buscar jogadores",
        });
      }

      const { playerTag } = params as { playerTag: string };

      if (!playerTag) {
        return statusFn(400, { message: "Tag do jogador é obrigatória" });
      }

      const playerData = await this.playerService.getPlayerCompleteData(playerTag, 100);

      return {
        success: true,
        data: playerData,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar jogador:", error);
      
      if (message.includes("não encontrado") || message.includes("not found")) {
        return statusFn(404, { message });
      }

      return statusFn(500, { message });
    }
  }

  /**
   * Busca apenas dados básicos do jogador (sem histórico)
   */
  async getPlayerBasic(context: ElysiaContext) {
    const { params, request, status: statusFn } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return statusFn(401, { message: "Não autenticado" });
      }

      // Verifica se tem assinatura ativa
      const hasActive = await this.hasActiveSubscription(session.user.id);
      if (!hasActive) {
        return statusFn(403, {
          message: "Você precisa ter uma assinatura ativa para buscar jogadores",
        });
      }

      const { playerTag } = params as { playerTag: string };

      if (!playerTag) {
        return statusFn(400, { message: "Tag do jogador é obrigatória" });
      }

      const playerData = await this.playerService.getPlayerByTag(playerTag);

      return {
        success: true,
        data: playerData,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar jogador:", error);
      
      if (message.includes("não encontrado") || message.includes("not found")) {
        return statusFn(404, { message });
      }

      return statusFn(500, { message });
    }
  }
}
