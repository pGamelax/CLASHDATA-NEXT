import {
  CurrentCWLRepository,
  CurrentCWLGroupData,
  CWLWarData,
} from "../repositories/current-cwl.repository";

export interface CWLPlayerPerformance {
  tag: string;
  name: string;
  totalAttacks: number;
  totalStars: number;
  perfectAttacks: number;
  performanceScore: number;
  warsParticipated: number;
}

export interface CurrentCWLAnalysis {
  group: CurrentCWLGroupData;
  currentRound?: number;
  currentWar?: CWLWarData;
  clanPosition?: number;
  standings?: Array<{
    clan: {
      tag: string;
      name: string;
      clanLevel: number;
      badgeUrls: {
        small: string;
        medium: string;
        large: string;
      };
    };
    wins: number;
    losses: number;
    stars: number;
    destructionPercentage: number;
  }>;
  seasonPerformance?: CWLPlayerPerformance[];
}

export class CurrentCWLService {
  constructor(private repository: CurrentCWLRepository) {}

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
   * Calcula o performanceScore para os membros de uma guerra
   */
  private calculateWarMemberScores(war: CWLWarData, clanTag: string): CWLWarData {
    // Valida se os dados do clan e opponent existem
    if (!war.clan || !war.opponent) {
      throw new Error("Dados da guerra incompletos: clan ou opponent não encontrado");
    }

    // Valida se os arrays de membros existem
    if (!war.clan.members || !Array.isArray(war.clan.members)) {
      throw new Error("Dados da guerra incompletos: membros do clan não encontrados");
    }

    if (!war.opponent.members || !Array.isArray(war.opponent.members)) {
      throw new Error("Dados da guerra incompletos: membros do oponente não encontrados");
    }

    const clanTagToFind = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const isOurClan = war.clan.tag === clanTagToFind;

    // Calcula performanceScore para cada membro do nosso clan
    const ourClanMembers = (isOurClan ? war.clan : war.opponent).members.map((member) => {
      const attacks = member.attacks || [];
      const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
      const performanceScore = this.calculatePerformanceScore(totalStars, attacks.length);

      return {
        ...member,
        performanceScore,
      };
    });

    // Calcula performanceScore para cada membro do oponente também
    const opponentMembers = (isOurClan ? war.opponent : war.clan).members.map((member) => {
      const attacks = member.attacks || [];
      const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
      const performanceScore = this.calculatePerformanceScore(totalStars, attacks.length);

      return {
        ...member,
        performanceScore,
      };
    });

    // Retorna a guerra com os membros atualizados
    if (isOurClan) {
      return {
        ...war,
        clan: {
          ...war.clan,
          members: ourClanMembers,
        },
        opponent: {
          ...war.opponent,
          members: opponentMembers,
        },
      };
    } else {
      return {
        ...war,
        clan: {
          ...war.clan,
          members: opponentMembers,
        },
        opponent: {
          ...war.opponent,
          members: ourClanMembers,
        },
      };
    }
  }

  /**
   * Calcula o performanceScore para ambos os lados da guerra (sem precisar do clanTag)
   */
  calculateWarMemberScoresForBothSides(war: CWLWarData): CWLWarData {
    // Valida se os dados do clan e opponent existem
    if (!war.clan || !war.opponent) {
      throw new Error("Dados da guerra incompletos: clan ou opponent não encontrado");
    }

    // Valida se os arrays de membros existem
    if (!war.clan.members || !Array.isArray(war.clan.members)) {
      throw new Error("Dados da guerra incompletos: membros do clan não encontrados");
    }

    if (!war.opponent.members || !Array.isArray(war.opponent.members)) {
      throw new Error("Dados da guerra incompletos: membros do oponente não encontrados");
    }

    // Calcula performanceScore para cada membro do clan
    const clanMembers = war.clan.members.map((member) => {
      const attacks = member.attacks || [];
      const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
      const performanceScore = this.calculatePerformanceScore(totalStars, attacks.length);

      return {
        ...member,
        performanceScore,
      };
    });

    // Calcula performanceScore para cada membro do oponente
    const opponentMembers = war.opponent.members.map((member) => {
      const attacks = member.attacks || [];
      const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
      const performanceScore = this.calculatePerformanceScore(totalStars, attacks.length);

      return {
        ...member,
        performanceScore,
      };
    });

    return {
      ...war,
      clan: {
        ...war.clan,
        members: clanMembers,
      },
      opponent: {
        ...war.opponent,
        members: opponentMembers,
      },
    };
  }

  async getCurrentCWL(clanTag: string): Promise<CurrentCWLAnalysis> {
    // Busca o grupo da CWL atual
    const group = await this.repository.getCurrentCWLGroup(clanTag);

    // Encontra a posição do clan no grupo
    const clanIndex = group.clans.findIndex(
      (c) => c.tag === (clanTag.startsWith("#") ? clanTag : `#${clanTag}`)
    );

    if (clanIndex === -1) {
      throw new Error("Clan não encontrado no grupo da CWL");
    }

    // Encontra a rodada atual baseada no estado do grupo
    // Se o grupo está "inWar", a rodada atual é a primeira rodada com guerras ativas
    // Se está "preparation", ainda não há rodada atual
    // Se está "ended", não há rodada atual
    let currentRound: number | undefined = undefined;
    let currentWarTag: string | null = null;
    const clanTagToFind = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    if (group.state === "inWar") {
      // Procura a primeira rodada com guerras ativas que contém nosso clan
      for (let i = 0; i < group.rounds.length; i++) {
        const round = group.rounds[i];
        const activeWars = round.warTags.filter((tag) => tag && tag !== "#0");
        
        if (activeWars.length > 0) {
          // Procura a guerra do clan nesta rodada
          for (const warTag of activeWars) {
            try {
              const war = await this.repository.getCWLWar(warTag);
              
              // Valida se os dados do clan e opponent existem
              if (!war.clan || !war.opponent) {
                continue;
              }
              
              if (war.clan.tag === clanTagToFind || war.opponent.tag === clanTagToFind) {
                // Verifica se a guerra está ativa (inWar ou preparation)
                if (war.state === "inWar" || war.state === "preparation") {
                  currentRound = i + 1;
                  currentWarTag = warTag;
                  break;
                }
              }
            } catch (error) {
              continue;
            }
          }
          if (currentWarTag) break;
        }
      }
    }

    // Busca dados da guerra atual se existir
    let currentWar: CWLWarData | undefined;
    if (currentWarTag) {
      try {
        const war = await this.repository.getCWLWar(currentWarTag);
        // Calcula performanceScore para os membros
        currentWar = this.calculateWarMemberScores(war, clanTag);
      } catch (error) {
        // Se não conseguir buscar a guerra, continua sem ela
        console.warn("Erro ao buscar guerra atual:", error);
      }
    }

    // Calcula standings básico (seria melhor com dados de todas as guerras, mas por enquanto só mostra o grupo)
    const standings = group.clans.map((clan) => ({
      clan: {
        tag: clan.tag,
        name: clan.name,
        clanLevel: clan.clanLevel,
        badgeUrls: clan.badgeUrls,
      },
      wins: 0, // Seria necessário buscar todas as guerras para calcular
      losses: 0,
      stars: 0,
      destructionPercentage: 0,
    }));

    // Calcula performance da temporada inteira
    const seasonPerformance = await this.calculateSeasonPerformance(group, clanTag);

    return {
      group,
      currentRound: currentRound > 0 ? currentRound : undefined,
      currentWar,
      clanPosition: clanIndex + 1,
      standings,
      seasonPerformance,
    };
  }

  /**
   * Calcula o performanceScore agregado de todos os membros da temporada inteira
   */
  private async calculateSeasonPerformance(
    group: CurrentCWLGroupData,
    clanTag: string
  ): Promise<CWLPlayerPerformance[]> {
    const clanTagToFind = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const playerMap = new Map<string, CWLPlayerPerformance>();

    // Itera sobre todas as rodadas
    for (const round of group.rounds) {
      const activeWars = round.warTags.filter((tag) => tag && tag !== "#0");

      // Para cada guerra ativa, busca os dados
      for (const warTag of activeWars) {
        try {
          const war = await this.repository.getCWLWar(warTag);
          
          // Valida se os dados do clan e opponent existem
          if (!war.clan || !war.opponent) {
            console.warn(`Guerra ${warTag} com dados incompletos: clan ou opponent não encontrado`);
            continue;
          }

          // Verifica se nosso clan está nesta guerra
          const isOurClan = war.clan.tag === clanTagToFind;
          const isOurOpponent = war.opponent.tag === clanTagToFind;
          
          if (!isOurClan && !isOurOpponent) continue;

          // Processa membros do nosso clan
          const ourClan = isOurClan ? war.clan : war.opponent;
          
          // Valida se os membros existem
          if (!ourClan.members || !Array.isArray(ourClan.members)) {
            console.warn(`Guerra ${warTag} com dados incompletos: membros não encontrados`);
            continue;
          }
          
          for (const member of ourClan.members) {
            const attacks = member.attacks || [];
            if (attacks.length === 0) continue;

            const existing = playerMap.get(member.tag);
            const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
            const perfectAttacks = attacks.filter(
              (attack) => attack.stars === 3 && attack.destructionPercentage === 100
            ).length;

            if (existing) {
              // Agrega estatísticas
              existing.totalAttacks += attacks.length;
              existing.totalStars += totalStars;
              existing.perfectAttacks += perfectAttacks;
              existing.warsParticipated += 1;
              // Recalcula performanceScore com todos os ataques
              existing.performanceScore = this.calculatePerformanceScore(
                existing.totalStars,
                existing.totalAttacks
              );
            } else {
              // Cria nova entrada
              playerMap.set(member.tag, {
                tag: member.tag,
                name: member.name,
                totalAttacks: attacks.length,
                totalStars: totalStars,
                perfectAttacks: perfectAttacks,
                performanceScore: this.calculatePerformanceScore(totalStars, attacks.length),
                warsParticipated: 1,
              });
            }
          }
        } catch (error) {
          // Continua para próxima guerra se houver erro
          console.warn(`Erro ao processar guerra ${warTag}:`, error);
          continue;
        }
      }
    }

    // Converte para array e ordena por performanceScore (maior primeiro)
    const performanceArray = Array.from(playerMap.values());
    performanceArray.sort((a, b) => b.performanceScore - a.performanceScore);

    return performanceArray;
  }
}
