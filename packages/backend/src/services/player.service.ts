import { ClashOfClansService } from "./clash-of-clans.service";
import { WarRepository, WarData } from "../repositories/war.repository";
import { CWLRepository, CWLData } from "../repositories/cwl.repository";
import { env } from "../env";

export interface PlayerWarHistory {
  warEndTime: string;
  warType: "war" | "cwl" | "friendly";
  clanTag: string;
  clanName: string;
  opponentTag: string;
  opponentName: string;
  stars: number;
  destructionPercentage: number;
  attacks: Array<{
    defenderTag: string;
    defenderName: string;
    stars: number;
    destructionPercentage: number;
    order: number;
    duration: number;
  }>;
  result: "win" | "loss" | "tie";
}

export interface PlayerStats {
  player: any; // Dados completos do jogador da API
  warHistory: PlayerWarHistory[];
  cwlHistory: PlayerWarHistory[];
  friendlyHistory: PlayerWarHistory[];
  totalStats: {
    wars: {
      total: number;
      wins: number;
      losses: number;
      ties: number;
      totalStars: number;
      totalDestruction: number;
      averageStars: number;
      averageDestruction: number;
    };
    cwl: {
      total: number;
      wins: number;
      losses: number;
      ties: number;
      totalStars: number;
      totalDestruction: number;
      averageStars: number;
      averageDestruction: number;
    };
    friendly: {
      total: number;
      wins: number;
      losses: number;
      ties: number;
      totalStars: number;
      totalDestruction: number;
      averageStars: number;
      averageDestruction: number;
    };
  };
}

export class PlayerService {
  private clashService: ClashOfClansService;
  private warRepository: WarRepository;
  private cwlRepository: CWLRepository;
  private readonly baseUrl = "https://api.clashk.ing";

  constructor() {
    this.clashService = new ClashOfClansService();
    this.warRepository = new WarRepository();
    this.cwlRepository = new CWLRepository();
  }

  /**
   * Busca dados completos do jogador
   */
  async getPlayerByTag(playerTag: string): Promise<any> {
    return await this.clashService.getPlayerByTag(playerTag);
  }

  /**
   * Busca histórico de guerra do jogador usando o endpoint /warhits
   * Determina corretamente em qual clan o jogador estava baseado em member_data e ataques/defesas
   */
  async getPlayerWarHistory(
    playerTag: string,
    limit: number = 50
  ): Promise<PlayerWarHistory[]> {
    const cleanPlayerTag = playerTag.startsWith("#") ? playerTag : `#${playerTag}`;
    const timestampEnd = Math.floor(Date.now() / 1000);
    const timestampStart = 0;
    
    const url = `${this.baseUrl}/player/${encodeURIComponent(cleanPlayerTag)}/warhits?timestamp_start=${timestampStart}&timestamp_end=${timestampEnd}&limit=${limit}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Erro ao buscar histórico de guerra: ${response.statusText}`);
      }

      const data = await response.json();
      const warHits = data.items || [];

      return warHits.map((hit: any) => {
        const warData = hit.war_data;
        const memberData = hit.member_data;
        const attacks = hit.attacks || [];
        const defenses = hit.defenses || [];

        let warType: "war" | "cwl" | "friendly" = "war";
        if (warData.type === "cwl" || warData.season) {
          warType = "cwl";
        } else if (warData.type === "friendly") {
          warType = "friendly";
        }

        const playerTagUpper = cleanPlayerTag.toUpperCase();
        let playerClan = warData.clan;
        let opponent = warData.opponent;
        
        if (memberData?.tag?.toUpperCase() === playerTagUpper) {
          playerClan = warData.clan;
          opponent = warData.opponent;
        } else {
          const hasPlayerAttacks = attacks.length > 0 && attacks.some((attack: any) => 
            attack.attackerTag?.toUpperCase() === playerTagUpper
          );
          
          const hasPlayerDefenses = defenses.length > 0 && defenses.some((defense: any) => 
            defense.defenderTag?.toUpperCase() === playerTagUpper
          );
          
          if (hasPlayerAttacks || hasPlayerDefenses) {
            playerClan = warData.clan;
            opponent = warData.opponent;
          } else {
            playerClan = warData.opponent;
            opponent = warData.clan;
          }
        }

        // Calcula estrelas totais (máximo 3 por guerra)
        const totalStars = Math.min(attacks.reduce((sum: number, attack: any) => sum + (attack.stars || 0), 0), 3);
        // Calcula destruição total (máximo 100% por guerra)
        const totalDestruction = Math.min(attacks.reduce((sum: number, attack: any) => sum + (attack.destructionPercentage || 0), 0), 100);

        let result: "win" | "loss" | "tie" = "tie";
        if (playerClan.stars > opponent.stars) {
          result = "win";
        } else if (playerClan.stars < opponent.stars) {
          result = "loss";
        } else if (playerClan.destructionPercentage > opponent.destructionPercentage) {
          result = "win";
        } else if (playerClan.destructionPercentage < opponent.destructionPercentage) {
          result = "loss";
        }

        // Função auxiliar para converter formato compacto ISO 8601 para Date
        const parseCompactISO = (dateStr: string): Date | null => {
          if (!dateStr) return null;
          
          // Formato compacto: 20260302T013802.000Z
          const compactMatch = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.(\d{1,3}))?Z?$/);
          if (compactMatch) {
            const [, year, month, day, hour, minute, second, millisecond] = compactMatch;
            const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${millisecond ? `.${millisecond.padEnd(3, '0')}` : ''}Z`;
            return new Date(isoString);
          }
          
          // Tenta formato ISO padrão
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) ? date : null;
        };

        let warEndTime = new Date().toISOString();
        if (warData.endTime) {
          const date = parseCompactISO(warData.endTime);
          if (date) {
            warEndTime = date.toISOString();
          } else if (warData.startTime) {
            const startDate = parseCompactISO(warData.startTime);
            if (startDate) {
              warEndTime = startDate.toISOString();
            }
          }
        } else if (warData.startTime) {
          const startDate = parseCompactISO(warData.startTime);
          if (startDate) {
            warEndTime = startDate.toISOString();
          }
        }

        return {
          warEndTime,
          warType,
          clanTag: playerClan.tag,
          clanName: playerClan.name,
          opponentTag: opponent.tag,
          opponentName: opponent.name,
          stars: totalStars,
          destructionPercentage: Math.round(totalDestruction * 100) / 100,
          attacks: attacks.map((attack: any) => ({
            defenderTag: attack.defenderTag || "",
            defenderName: attack.defender?.name || "",
            stars: attack.stars || 0,
            destructionPercentage: attack.destructionPercentage || 0,
            order: attack.order || attack.attack_order || 0,
            duration: attack.duration || 0,
          })),
          result,
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Busca histórico de CWL do jogador
   */
  async getPlayerCWLHistory(
    playerTag: string,
    limit: number = 50
  ): Promise<PlayerWarHistory[]> {
    const history = await this.getPlayerWarHistory(playerTag, limit);
    return history.filter(war => war.warType === "cwl");
  }

  /**
   * Busca histórico de amistosa do jogador
   */
  async getPlayerFriendlyHistory(
    playerTag: string,
    limit: number = 50
  ): Promise<PlayerWarHistory[]> {
    const history = await this.getPlayerWarHistory(playerTag, limit);
    return history.filter(war => war.warType === "friendly");
  }

  /**
   * Agrupa histórico por guerra única
   */
  groupHistoryByWar(history: PlayerWarHistory[]): PlayerWarHistory[] {
    const grouped = new Map<string, PlayerWarHistory>();
    
    history.forEach((war) => {
      // Cria uma chave única para a guerra usando warEndTime, clanTag e opponentTag
      const warKey = `${war.warEndTime}_${war.clanTag}_${war.opponentTag}`;
      
      if (grouped.has(warKey)) {
        const existing = grouped.get(warKey)!;
        // Limita estrelas ao máximo de 3 por guerra
        existing.stars = Math.min(existing.stars + war.stars, 3);
        // Limita destruição ao máximo de 100%
        existing.destructionPercentage = Math.min(existing.destructionPercentage + war.destructionPercentage, 100);
        // Mantém o resultado da guerra
        existing.result = war.result;
        // Combina os ataques
        existing.attacks = [...existing.attacks, ...war.attacks];
      } else {
        grouped.set(warKey, {
          ...war,
          // Garante que estrelas não ultrapassem 3
          stars: Math.min(war.stars, 3),
          attacks: [...war.attacks],
        });
      }
    });
    
    return Array.from(grouped.values());
  }

  /**
   * Calcula estatísticas totais do jogador
   */
  calculatePlayerStats(
    warHistory: PlayerWarHistory[],
    cwlHistory: PlayerWarHistory[],
    friendlyHistory: PlayerWarHistory[]
  ): PlayerStats["totalStats"] {
    // Agrupa as guerras antes de calcular estatísticas
    const groupedWarHistory = this.groupHistoryByWar(warHistory);
    const groupedCwlHistory = this.groupHistoryByWar(cwlHistory);
    const groupedFriendlyHistory = this.groupHistoryByWar(friendlyHistory);

    const calculateStats = (history: PlayerWarHistory[]) => {
      const total = history.length;
      const wins = history.filter(w => w.result === "win").length;
      const losses = history.filter(w => w.result === "loss").length;
      const ties = history.filter(w => w.result === "tie").length;
      const totalStars = history.reduce((sum, w) => sum + w.stars, 0);
      const totalDestruction = history.reduce((sum, w) => sum + w.destructionPercentage, 0);
      const averageStars = total > 0 ? totalStars / total : 0;
      const averageDestruction = total > 0 ? totalDestruction / total : 0;

      return {
        total,
        wins,
        losses,
        ties,
        totalStars,
        totalDestruction,
        averageStars: Math.round(averageStars * 100) / 100,
        averageDestruction: Math.round(averageDestruction * 100) / 100,
      };
    };

    return {
      wars: calculateStats(groupedWarHistory),
      cwl: calculateStats(groupedCwlHistory),
      friendly: calculateStats(groupedFriendlyHistory),
    };
  }

  /**
   * Busca dados completos do jogador com histórico
   */
  async getPlayerCompleteData(
    playerTag: string,
    limit: number = 50
  ): Promise<PlayerStats> {
    const player = await this.getPlayerByTag(playerTag);
    const allHistory = await this.getPlayerWarHistory(playerTag, limit);
    
    const warHistory = allHistory.filter(w => w.warType === "war");
    const cwlHistory = allHistory.filter(w => w.warType === "cwl");
    const friendlyHistory = allHistory.filter(w => w.warType === "friendly");

    // Agrupa as guerras antes de calcular estatísticas
    const groupedWarHistory = this.groupHistoryByWar(warHistory);
    const groupedCwlHistory = this.groupHistoryByWar(cwlHistory);
    const groupedFriendlyHistory = this.groupHistoryByWar(friendlyHistory);

    const totalStats = this.calculatePlayerStats(warHistory, cwlHistory, friendlyHistory);

    return {
      player,
      warHistory: groupedWarHistory,
      cwlHistory: groupedCwlHistory,
      friendlyHistory: groupedFriendlyHistory,
      totalStats,
    };
  }
}
