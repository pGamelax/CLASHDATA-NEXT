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
    // Se não tem clan ou opponent, retorna a guerra sem processar
    if (!war.clan || !war.opponent) {
      return war;
    }

    const clanTagToFind = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const isOurClan = war.clan.tag === clanTagToFind;

    // Valida se os arrays de membros existem, se não existir, usa array vazio
    const ourClan = isOurClan ? war.clan : war.opponent;
    const opponent = isOurClan ? war.opponent : war.clan;

    // Calcula performanceScore para cada membro do nosso clan
    const ourClanMembers = (ourClan.members && Array.isArray(ourClan.members)
      ? ourClan.members
      : []).map((member) => {
      const attacks = member.attacks || [];
      const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
      const performanceScore = this.calculatePerformanceScore(totalStars, attacks.length);

      return {
        ...member,
        performanceScore,
      };
    });

    // Calcula performanceScore para cada membro do oponente também
    const opponentMembers = (opponent.members && Array.isArray(opponent.members)
      ? opponent.members
      : []).map((member) => {
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
    // Se não tem clan ou opponent, retorna a guerra sem processar
    if (!war.clan || !war.opponent) {
      return war;
    }

    // Valida se os arrays de membros existem, se não existir, usa array vazio
    const clanMembers = (war.clan.members && Array.isArray(war.clan.members) 
      ? war.clan.members 
      : []).map((member) => {
      const attacks = member.attacks || [];
      const totalStars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
      const performanceScore = this.calculatePerformanceScore(totalStars, attacks.length);

      return {
        ...member,
        performanceScore,
      };
    });

    // Calcula performanceScore para cada membro do oponente
    const opponentMembers = (war.opponent.members && Array.isArray(war.opponent.members)
      ? war.opponent.members
      : []).map((member) => {
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

    if (group.state === "inWar" || group.state === "preparation") {
      // Procura a primeira rodada com guerras ativas que contém nosso clan
      for (let i = 0; i < group.rounds.length; i++) {
        const round = group.rounds[i];
        const activeWars = round.warTags.filter((tag) => tag && tag !== "#0");
        
        if (activeWars.length > 0) {
          // Procura a guerra do clan nesta rodada
          // Verifica todas as guerras para encontrar a que contém nosso clan
          for (const warTag of activeWars) {
            try {
              const war = await this.repository.getCWLWar(warTag);
              
              // Verifica se a guerra está ativa (inWar ou preparation)
              if (war.state === "inWar" || war.state === "preparation") {
                // Se tem clan e opponent, verifica se é nosso clan
                if (war.clan && war.opponent) {
                  if (war.clan.tag === clanTagToFind || war.opponent.tag === clanTagToFind) {
                    currentRound = i + 1;
                    currentWarTag = warTag;
                    break;
                  }
                }
                // Se está em preparation sem clan/opponent, não podemos determinar se é nossa guerra
                // então continuamos procurando nas outras guerras
              }
            } catch (error) {
              // Se houver erro ao buscar a guerra, continua para a próxima
              continue;
            }
          }
          // Se encontrou a guerra do nosso clan, para de procurar
          if (currentWarTag) break;
        }
      }
    }

    // Busca dados da guerra atual se existir
    let currentWar: CWLWarData | undefined;
    if (currentWarTag) {
      try {
        const war = await this.repository.getCWLWar(currentWarTag);
        // Se a guerra tem clan e opponent, calcula performanceScore para os membros
        // Se não tem (estado preparation), retorna a guerra como está
        if (war.clan && war.opponent) {
          currentWar = this.calculateWarMemberScores(war, clanTag);
        } else {
          // Em preparation, pode não ter todos os dados ainda
          currentWar = war;
        }
      } catch (error) {
        // Continua sem a guerra atual
      }
    }

    // Calcula standings buscando todas as guerras de todas as rodadas
    const standings = await this.calculateStandings(group);

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
   * Calcula os standings do grupo CWL baseado em todas as guerras já finalizadas
   */
  private async calculateStandings(
    group: CurrentCWLGroupData
  ): Promise<Array<{
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
  }>> {
    // Inicializa standings para todos os clãs
    const standingsMap = new Map<string, {
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
      totalDestruction: number;
      warsCount: number;
    }>();

    // Inicializa todos os clãs
    for (const clan of group.clans) {
      standingsMap.set(clan.tag, {
        clan: {
          tag: clan.tag,
          name: clan.name,
          clanLevel: clan.clanLevel,
          badgeUrls: clan.badgeUrls,
        },
        wins: 0,
        losses: 0,
        stars: 0,
        totalDestruction: 0,
        warsCount: 0,
      });
    }

    // Itera sobre todas as rodadas
    for (const round of group.rounds) {
      const activeWars = round.warTags.filter((tag) => tag && tag !== "#0");

      // Para cada guerra ativa, busca os dados
      for (const warTag of activeWars) {
        try {
          const war = await this.repository.getCWLWar(warTag);
          
          // Processa guerras que têm dados de clan e opponent (inclui inWar, warEnded, ended)
          // Não processa apenas "preparation" que não tem dados ainda
          if (!war.clan || !war.opponent) {
            continue;
          }

          // Ignora apenas se estiver em preparação sem dados
          if (war.state === "preparation" && (!war.clan.stars && !war.opponent.stars)) {
            continue;
          }

          const clanStanding = standingsMap.get(war.clan.tag);
          const opponentStanding = standingsMap.get(war.opponent.tag);

          if (clanStanding && opponentStanding) {
            // Adiciona estrelas e destruição (mesmo que a guerra ainda esteja em andamento)
            clanStanding.stars += war.clan.stars || 0;
            clanStanding.totalDestruction += war.clan.destructionPercentage || 0;
            clanStanding.warsCount += 1;

            opponentStanding.stars += war.opponent.stars || 0;
            opponentStanding.totalDestruction += war.opponent.destructionPercentage || 0;
            opponentStanding.warsCount += 1;

            // Determina vencedor apenas se a guerra estiver finalizada
            // Para guerras em andamento, não conta vitória/derrota ainda
            if (war.state === "ended" || war.state === "warEnded") {
              const clanStars = war.clan.stars || 0;
              const opponentStars = war.opponent.stars || 0;
              const clanDestruction = war.clan.destructionPercentage || 0;
              const opponentDestruction = war.opponent.destructionPercentage || 0;

              if (clanStars > opponentStars) {
                clanStanding.wins += 1;
                opponentStanding.losses += 1;
              } else if (opponentStars > clanStars) {
                opponentStanding.wins += 1;
                clanStanding.losses += 1;
              } else if (clanDestruction > opponentDestruction) {
                clanStanding.wins += 1;
                opponentStanding.losses += 1;
              } else if (opponentDestruction > clanDestruction) {
                opponentStanding.wins += 1;
                clanStanding.losses += 1;
              }
              // Se empate em estrelas e destruição, não conta como vitória nem derrota
            }
          }
        } catch (error) {
          // Continua para a próxima guerra em caso de erro
          continue;
        }
      }
    }

    // Converte para array e calcula destruição média
    return Array.from(standingsMap.values()).map((standing) => ({
      clan: standing.clan,
      wins: standing.wins,
      losses: standing.losses,
      stars: standing.stars,
      destructionPercentage: standing.warsCount > 0 
        ? standing.totalDestruction / standing.warsCount 
        : 0,
    }));
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
          
          if (!war.clan || !war.opponent) {
            continue;
          }

          // Verifica se nosso clan está nesta guerra
          const isOurClan = war.clan.tag === clanTagToFind;
          const isOurOpponent = war.opponent.tag === clanTagToFind;
          
          if (!isOurClan && !isOurOpponent) continue;

          // Processa membros do nosso clan
          const ourClan = isOurClan ? war.clan : war.opponent;
          
          if (!ourClan.members || !Array.isArray(ourClan.members)) {
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
          continue;
        }
      }
    }

    // Converte para array e ordena por performanceScore (maior primeiro)
    const performanceArray = Array.from(playerMap.values());
    performanceArray.sort((a, b) => b.performanceScore - a.performanceScore);

    return performanceArray;
  }

  /**
   * Retorna a contagem de membros por Town Hall level para cada clã do grupo CWL
   * Usa apenas os membros cadastrados na CWL (não todos os membros do clã)
   */
  async getClansTownHalls(clanTag: string): Promise<Array<{
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
    townHalls: Record<string, number>;
  }>> {
    const group = await this.repository.getCurrentCWLGroup(clanTag);
    
    // Usa os membros que já vêm no grupo CWL (membros cadastrados)
    const clansData = group.clans.map((clan) => {
      // Conta membros cadastrados na CWL por Town Hall level
      const townHalls: Record<string, number> = {};
      
      if (clan.members && Array.isArray(clan.members)) {
        clan.members.forEach((member) => {
          const thLevel = member.townHallLevel;
          const key = `th${thLevel}`;
          townHalls[key] = (townHalls[key] || 0) + 1;
        });
      }

      return {
        clan: {
          tag: clan.tag,
          name: clan.name,
          clanLevel: clan.clanLevel,
          badgeUrls: clan.badgeUrls,
        },
        townHalls,
      };
    });

    return clansData;
  }
}
