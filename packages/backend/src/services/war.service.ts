import { WarRepository, WarData } from "../repositories/war.repository";

export interface PlayerStats {
  tag: string;
  name: string;
  totalAttacks: number;
  totalStars: number;
  totalDestruction: number;
  averageStars: number;
  averageDestruction: number;
  bayesianScore: number; // Score de performance: (K * GLOBAL_AVG + totalStars) / (K + attackCount)
  warsParticipated: number;
  perfectAttacks: number; // Ataques com 3 estrelas e 100% de destruição
  attacks: Array<{
    warEndTime: string;
    stars: number;
    destructionPercentage: number;
    defenderTag: string;
    opponentClanName: string;
    order: number;
    duration: number;
  }>;
}

export class WarService {
  constructor(private warRepository: WarRepository) {}

  /**
   * Calcula o score de performance usando média bayesiana
   * Fórmula: (K * GLOBAL_AVG + totalStars) / (K + attackCount)
   * Onde K = 8 e GLOBAL_AVG = 2
   * O score máximo é 3 (máximo de estrelas por ataque)
   */
  private calculatePerformanceScore(
    totalStars: number,
    attackCount: number
  ): number {
    const K = 8;
    const GLOBAL_AVG = 2;
    
    if (attackCount === 0) return 0;
    
    const performanceScore = (K * GLOBAL_AVG + totalStars) / (K + attackCount);
    
    // Limita o score máximo a 3 (máximo de estrelas por ataque)
    return Math.min(performanceScore, 3);
  }

  /**
   * Converte timestamp para início do mês (dia 01 às 00:00:00)
   */
  private getMonthStartTimestamp(year: number, month: number): number {
    // Cria data para o dia 01 do mês às 00:00:00
    const date = new Date(year, month - 1, 1, 0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Converte timestamp para fim do mês (último dia às 23:59:59)
   */
  private getMonthEndTimestamp(year: number, month: number): number {
    // Cria data para o último dia do mês às 23:59:59
    // new Date(year, month, 0) retorna o último dia do mês anterior (que é o último dia do mês atual)
    const lastDay = new Date(year, month, 0).getDate();
    const date = new Date(year, month - 1, lastDay, 23, 59, 59, 999);
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Busca guerras por mês
   */
  async getWarsByMonth(
    clanTag: string,
    year: number,
    month: number
  ): Promise<WarData[]> {
    const timestampStart = this.getMonthStartTimestamp(year, month);
    const timestampEnd = this.getMonthEndTimestamp(year, month);

    const response = await this.warRepository.getPreviousWars(
      clanTag,
      timestampStart,
      timestampEnd,
      50
    );

    return response.items || [];
  }

  /**
   * Busca guerras por múltiplos meses
   */
  async getWarsByMonths(
    clanTag: string,
    months: Array<{ year: number; month: number }>
  ): Promise<WarData[]> {
    const results = await Promise.allSettled(
      months.map(({ year, month }) => this.getWarsByMonth(clanTag, year, month))
    );

    const allWars: WarData[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allWars.push(...result.value);
      } else {
        console.error("Erro ao buscar guerras para um mês:", result.reason);
      }
    }

    // Remove duplicatas baseado no timestamp
    const uniqueWars = allWars.filter(
      (war, index, self) =>
        index === self.findIndex((w) => w.timestamp === war.timestamp)
    );

    return uniqueWars;
  }

  /**
   * Calcula estatísticas dos jogadores baseado nas guerras
   */
  calculatePlayerStats(wars: WarData[], clanTag: string): PlayerStats[] {
    const playerMap = new Map<string, PlayerStats>();
    const cleanClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    // Processa cada guerra
    for (const war of wars) {
      // Filtra guerras de CWL
      // Guerras de CWL têm:
      // - tag no nível raiz
      // - season (ex: "2026-01")
      // - warStartTime (em vez de startTime)
      // - NÃO têm state, teamSize, attacksPerMember, battleModifier
      
      const hasTag = war.tag !== undefined && 
                    war.tag !== null && 
                    war.tag !== '' &&
                    String(war.tag).trim() !== '';
      
      const hasSeason = war.season !== undefined && 
                       war.season !== null && 
                       war.season !== '' &&
                       String(war.season).trim() !== '';
      
      const hasWarStartTime = war.warStartTime !== undefined && 
                             war.warStartTime !== null && 
                             war.warStartTime !== '';
      
      // Se tem tag, season ou warStartTime, é guerra de CWL
      if (hasTag || hasSeason || hasWarStartTime) {
        continue; // Pula guerras de CWL
      }
      
      // Guerras normais devem ter state e endTime
      if (!war.state || !war.endTime) {
        continue; // Pula se não for uma guerra normal válida
      }
      
      // Garante que endTime existe (já validado acima, mas TypeScript precisa saber)
      const warEndTime = war.endTime;
      if (!warEndTime) continue;
      
      // Verifica se o nosso clan está como 'clan' ou como 'opponent'
      const isOurClanAsClan = war.clan?.tag?.toUpperCase() === cleanClanTag.toUpperCase();
      const isOurClanAsOpponent = war.opponent?.tag?.toUpperCase() === cleanClanTag.toUpperCase();
      
      if (!isOurClanAsClan && !isOurClanAsOpponent) continue;
      
      // Determina qual é o nosso clan e qual é o oponente
      const ourClan = isOurClanAsClan ? war.clan : war.opponent;
      const opponentClan = isOurClanAsClan ? war.opponent : war.clan;
      
      if (!ourClan || !ourClan.members) continue;
      
      // Usa o nome do oponente ou um fallback
      const opponentClanName = opponentClan?.name || "Clan Desconhecido";

      for (const member of ourClan.members) {
        const tag = member.tag;
        const existing = playerMap.get(tag);

        const attacks = member.attacks || [];
        
        if (attacks.length === 0) continue; // Pula se não houver ataques
        
        const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
        const totalDestruction = attacks.reduce(
          (sum, attack) => sum + attack.destructionPercentage,
          0
        );
        // Conta ataques perfeitos (3 estrelas e 100% de destruição)
        const perfectAttacks = attacks.filter(
          (attack) => attack.stars === 3 && attack.destructionPercentage === 100
        ).length;

        if (existing) {
          // Atualiza estatísticas existentes
          existing.totalAttacks += attacks.length;
          existing.totalStars += totalStars;
          existing.totalDestruction += totalDestruction;
          existing.warsParticipated += 1;
          existing.perfectAttacks += perfectAttacks;
          existing.averageStars =
            existing.totalStars / existing.totalAttacks;
          existing.averageDestruction =
            existing.totalDestruction / existing.totalAttacks;
          existing.bayesianScore = this.calculatePerformanceScore(
            existing.totalStars,
            existing.totalAttacks
          );

          // Adiciona ataques desta guerra
          attacks.forEach((attack) => {
            existing.attacks.push({
              warEndTime: warEndTime, // Usa a variável já validada
              stars: attack.stars,
              destructionPercentage: attack.destructionPercentage,
              defenderTag: attack.defenderTag,
              opponentClanName: opponentClanName,
              order: attack.order,
              duration: attack.duration,
            });
          });
        } else {
          // Cria nova entrada
          const stats: PlayerStats = {
            tag: member.tag,
            name: member.name,
            totalAttacks: attacks.length,
            totalStars: totalStars,
            totalDestruction: totalDestruction,
            averageStars: attacks.length > 0 ? totalStars / attacks.length : 0,
            averageDestruction:
              attacks.length > 0 ? totalDestruction / attacks.length : 0,
            bayesianScore: this.calculatePerformanceScore(
              totalStars,
              attacks.length
            ),
            warsParticipated: 1,
            perfectAttacks: perfectAttacks,
            attacks: attacks.map((attack) => ({
              warEndTime: warEndTime, // Usa a variável já validada
              stars: attack.stars,
              destructionPercentage: attack.destructionPercentage,
              defenderTag: attack.defenderTag,
              opponentClanName: opponentClanName,
              order: attack.order,
              duration: attack.duration,
            })),
          };
          playerMap.set(tag, stats);
        }
      }
    }

    // Converte para array e ordena por score bayesiano (maior primeiro)
    const statsArray = Array.from(playerMap.values());
    statsArray.sort((a, b) => b.bayesianScore - a.bayesianScore);

    return statsArray;
  }

  /**
   * Busca e calcula estatísticas dos jogadores para os meses especificados
   */
  async getPlayerRanking(
    clanTag: string,
    months: Array<{ year: number; month: number }>
  ): Promise<PlayerStats[]> {
    const wars = await this.getWarsByMonths(clanTag, months);
    return this.calculatePlayerStats(wars, clanTag);
  }
}

