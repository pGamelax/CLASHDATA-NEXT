import { CWLRepository, CWLData } from "../repositories/cwl.repository";

export interface CWLPlayerStats {
  tag: string;
  name: string;
  totalAttacks: number;
  totalStars: number;
  totalDestruction: number;
  averageStars: number;
  averageDestruction: number;
  bayesianScore: number; // Score de performance: (K * GLOBAL_AVG + totalStars) / (K + attackCount)
  warsParticipated: number; // Número de guerras participadas (não temporadas)
  perfectAttacks: number; // Ataques com 3 estrelas e 100% de destruição
  attacks: Array<{
    season: string;
    stars: number;
    destructionPercentage: number;
    defenderTag: string;
    opponentClanName: string;
    order: number;
    duration: number;
  }>;
}

export class CWLService {
  constructor(private cwlRepository: CWLRepository) {}

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
   * Converte ano e mês para formato de temporada (ex: 2026, 1 -> "2026-01")
   */
  private formatSeason(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  /**
   * Busca CWL por temporadas (meses)
   */
  async getCWLBySeasons(
    clanTag: string,
    months: Array<{ year: number; month: number }>
  ): Promise<CWLData[]> {
    // Converte meses para formato de temporada
    const seasons = months.map(({ year, month }) => this.formatSeason(year, month));
    
    // Remove duplicatas
    const uniqueSeasons = [...new Set(seasons)];
    
    return await this.cwlRepository.getCWLBySeasons(clanTag, uniqueSeasons);
  }

  /**
   * Calcula estatísticas dos jogadores baseado nos dados de CWL
   */
  calculatePlayerStats(cwlDataArray: CWLData[], clanTag: string): CWLPlayerStats[] {
    const playerMap = new Map<string, CWLPlayerStats>();
    const cleanClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    // Processa cada temporada de CWL
    for (const cwlData of cwlDataArray) {
      // Usa o nome da temporada como identificador
      const season = cwlData.season;

      // Processa através de rounds.warTags (estrutura real da API)
      if (cwlData.rounds && Array.isArray(cwlData.rounds)) {
        for (const round of cwlData.rounds) {
          if (!round.warTags || !Array.isArray(round.warTags)) continue;
          
          // Processa cada guerra dentro do round
          for (const war of round.warTags) {
            // Verifica se o nosso clan está como 'clan' ou como 'opponent'
            const isOurClanAsClan = war.clan?.tag?.toUpperCase() === cleanClanTag.toUpperCase();
            const isOurClanAsOpponent = war.opponent?.tag?.toUpperCase() === cleanClanTag.toUpperCase();
            
            if (!isOurClanAsClan && !isOurClanAsOpponent) continue;
            
            // Determina qual é o nosso clan e qual é o oponente
            const ourClan = isOurClanAsClan ? war.clan : war.opponent;
            const opponentClan = isOurClanAsClan ? war.opponent : war.clan;
            
            if (!ourClan || !ourClan.members) continue;
            
            // Usa o nome do oponente
            const opponentClanName = opponentClan?.name || "Clan Desconhecido";
            const warEndTime = war.endTime || war.warStartTime || "";
            
            // Processa cada membro do nosso clan
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
              const perfectAttacks = attacks.filter(
                (attack) => attack.stars === 3 && attack.destructionPercentage === 100
              ).length;
              
              if (existing) {
                existing.totalAttacks += attacks.length;
                existing.totalStars += totalStars;
                existing.totalDestruction += totalDestruction;
                // Garante que warsParticipated existe (pode ser undefined em dados antigos)
                existing.warsParticipated = (existing.warsParticipated || 0) + 1; // Conta guerras, não temporadas
                existing.perfectAttacks += perfectAttacks;
                existing.averageStars = existing.totalStars / existing.totalAttacks;
                existing.averageDestruction = existing.totalDestruction / existing.totalAttacks;
                existing.bayesianScore = this.calculatePerformanceScore(
                  existing.totalStars,
                  existing.totalAttacks
                );
                
                attacks.forEach((attack) => {
                  existing.attacks.push({
                    season: season,
                    stars: attack.stars,
                    destructionPercentage: attack.destructionPercentage,
                    defenderTag: attack.defenderTag,
                    opponentClanName: opponentClanName,
                    order: attack.order,
                    duration: attack.duration,
                  });
                });
              } else {
                const stats: CWLPlayerStats = {
                  tag: member.tag,
                  name: member.name,
                  totalAttacks: attacks.length,
                  totalStars: totalStars,
                  totalDestruction: totalDestruction,
                  averageStars: totalStars / attacks.length,
                  averageDestruction: totalDestruction / attacks.length,
                  bayesianScore: this.calculatePerformanceScore(totalStars, attacks.length),
                  warsParticipated: 1, // Conta guerras, não temporadas
                  perfectAttacks: perfectAttacks,
                  attacks: attacks.map((attack) => ({
                    season: season,
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
        }
      }
      
      // Se não houver rounds, tenta processar através de clans.members (fallback)
      if (!cwlData.rounds || cwlData.rounds.length === 0) {
        // Encontra o clan específico nos dados
        const clan = cwlData.clans.find((c) => 
          c.tag.toUpperCase() === cleanClanTag.toUpperCase()
        );

        if (!clan || !clan.members) continue;

        // Processa cada membro do clan
        for (const member of clan.members) {
          const tag = member.tag;
          const existing = playerMap.get(tag);

          const attacks = member.attacks || [];
          
          // Se não houver ataques, pula este membro
          if (attacks.length === 0) continue;
          
          const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
          const totalDestruction = attacks.reduce(
            (sum, attack) => sum + attack.destructionPercentage,
            0
          );
          // Conta ataques perfeitos (3 estrelas e 100% de destruição)
          const perfectAttacks = attacks.filter(
            (attack) => attack.stars === 3 && attack.destructionPercentage === 100
          ).length;

          // Encontra o nome do clan oponente (primeiro clan que não é o nosso)
          const opponentClan = cwlData.clans.find(
            (c) => c.tag.toUpperCase() !== cleanClanTag.toUpperCase()
          );
          const opponentClanName = opponentClan?.name || "Clan Desconhecido";

          if (existing) {
            // Atualiza estatísticas existentes
            existing.totalAttacks += attacks.length;
            existing.totalStars += totalStars;
            existing.totalDestruction += totalDestruction;
            // Garante que warsParticipated existe (pode ser undefined em dados antigos)
            existing.warsParticipated = (existing.warsParticipated || 0) + 1; // Conta guerras, não temporadas
            existing.perfectAttacks += perfectAttacks;
            existing.averageStars =
              existing.totalStars / existing.totalAttacks;
            existing.averageDestruction =
              existing.totalDestruction / existing.totalAttacks;
            existing.bayesianScore = this.calculatePerformanceScore(
              existing.totalStars,
              existing.totalAttacks
            );

            // Adiciona ataques desta temporada
            attacks.forEach((attack) => {
              existing.attacks.push({
                season: season,
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
            const stats: CWLPlayerStats = {
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
              warsParticipated: 1, // Conta guerras, não temporadas
              perfectAttacks: perfectAttacks,
              attacks: attacks.map((attack) => ({
                season: season,
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
    }

    // Converte para array e ordena por score bayesiano (maior primeiro)
    const statsArray = Array.from(playerMap.values());
    statsArray.sort((a, b) => b.bayesianScore - a.bayesianScore);

    return statsArray;
  }

  /**
   * Busca e calcula estatísticas dos jogadores para as temporadas especificadas
   */
  async getPlayerRanking(
    clanTag: string,
    months: Array<{ year: number; month: number }>
  ): Promise<CWLPlayerStats[]> {
    const cwlData = await this.getCWLBySeasons(clanTag, months);
    return this.calculatePlayerStats(cwlData, clanTag);
  }
}

