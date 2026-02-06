import { CurrentWarRepository, CurrentWarData } from "../repositories/current-war.repository";

export interface WarPrediction {
  clanWinProbability: number; // Probabilidade de vitória do nosso clan (0-100)
  opponentWinProbability: number; // Probabilidade de vitória do oponente (0-100)
  tieProbability: number; // Probabilidade de empate (0-100)
  reasoning: string; // Explicação da previsão
}

export interface ThreeStarAttack {
  attackerTag: string;
  attackerName: string;
  defenderTag: string;
  defenderName: string;
  stars: number;
  destructionPercentage: number;
  order: number;
  duration: number;
  timestamp?: string; // Timestamp do ataque (se disponível)
  isClanAttack: boolean; // true se é ataque do nosso clan, false se é do oponente
}

export interface WarTimelineEvent {
  type: "attack" | "defense";
  attackerTag: string;
  attackerName: string;
  defenderTag: string;
  defenderName: string;
  stars: number;
  destructionPercentage: number;
  order: number;
  timestamp?: string;
  isClanAttack: boolean; // true se é ataque do nosso clan
  clanStarsAfter: number; // Estrelas do nosso clan após este ataque
  opponentStarsAfter: number; // Estrelas do oponente após este ataque
}

export interface WarStatus {
  status: "winning" | "tied" | "losing" | "won" | "tie" | "lost" | "preparation" | "notInWar";
  label: string; // "Ganhando", "Empatado", "Perdendo", "Ganhou", "Empate", "Perdeu", "Preparação", "Não está em guerra"
}

export interface CurrentWarAnalysis {
  war: CurrentWarData;
  prediction: WarPrediction;
  warStatus: WarStatus;
  warCloser?: {
    attackerTag: string;
    attackerName: string;
    defenderTag: string;
    defenderName: string;
    stars: number;
    destructionPercentage: number;
    order: number;
    timestamp?: string;
    isClanAttack: boolean;
  };
  threeStarAttacks: ThreeStarAttack[];
  timeline: WarTimelineEvent[];
}

export class CurrentWarService {
  constructor(private currentWarRepository: CurrentWarRepository) {}

  /**
   * Busca a guerra atual do clan
   */
  async getCurrentWar(clanTag: string): Promise<CurrentWarData | null> {
    return await this.currentWarRepository.getCurrentWar(clanTag);
  }

  /**
   * Calcula previsão de vitória baseada em estatísticas atuais
   */
  calculatePrediction(war: CurrentWarData): WarPrediction {
    if (!war.clan || !war.opponent) {
      return {
        clanWinProbability: 0,
        opponentWinProbability: 0,
        tieProbability: 0,
        reasoning: "Dados insuficientes para calcular previsão",
      };
    }

    const clanStars = war.clan.stars || 0;
    const opponentStars = war.opponent.stars || 0;
    const clanDestruction = war.clan.destructionPercentage || 0;
    const opponentDestruction = war.opponent.destructionPercentage || 0;
    const clanAttacks = war.clan.attacks || 0;
    const opponentAttacks = war.opponent.attacks || 0;
    const teamSize = war.teamSize || 0;
    const maxAttacks = teamSize * (war.attacksPerMember || 2);

    // Calcula fatores de previsão
    const starDifference = clanStars - opponentStars;
    const destructionDifference = clanDestruction - opponentDestruction;
    const attackEfficiency = maxAttacks > 0 ? clanAttacks / maxAttacks : 0;
    const opponentAttackEfficiency = maxAttacks > 0 ? opponentAttacks / maxAttacks : 0;

    // Pesos para cada fator
    const starWeight = 0.4; // 40% peso nas estrelas
    const destructionWeight = 0.3; // 30% peso na destruição
    const efficiencyWeight = 0.3; // 30% peso na eficiência de ataques

    // Normaliza diferenças (assumindo máximo de 3 estrelas por ataque e 100% destruição)
    const normalizedStarDiff = starDifference / (teamSize * 3); // Diferença normalizada
    const normalizedDestructionDiff = destructionDifference / 100; // Diferença normalizada
    const normalizedEfficiencyDiff = attackEfficiency - opponentAttackEfficiency;

    // Calcula score de vantagem (-1 a 1)
    const advantageScore =
      normalizedStarDiff * starWeight +
      normalizedDestructionDiff * destructionWeight +
      normalizedEfficiencyDiff * efficiencyWeight;

    // Converte para probabilidades (0-100)
    // Se advantageScore > 0, nosso clan tem vantagem
    // Se advantageScore < 0, oponente tem vantagem
    const baseProbability = 50 + advantageScore * 50; // Base 50% + ajuste baseado na vantagem

    let clanWinProbability = Math.max(0, Math.min(100, baseProbability));
    let opponentWinProbability = Math.max(0, Math.min(100, 100 - baseProbability));
    let tieProbability = 0;

    // Se a diferença for muito pequena, aumenta probabilidade de empate
    if (Math.abs(advantageScore) < 0.1) {
      tieProbability = 20;
      clanWinProbability = (100 - tieProbability) * (0.5 + advantageScore * 0.5);
      opponentWinProbability = 100 - tieProbability - clanWinProbability;
    }

    // Gera explicação
    let reasoning = "";
    if (starDifference > 0) {
      reasoning += `Nosso clan está ${starDifference} estrelas à frente. `;
    } else if (starDifference < 0) {
      reasoning += `O oponente está ${Math.abs(starDifference)} estrelas à frente. `;
    } else {
      reasoning += "Empate em estrelas. ";
    }

    if (destructionDifference > 0) {
      reasoning += `Vantagem de ${destructionDifference.toFixed(1)}% em destruição. `;
    } else if (destructionDifference < 0) {
      reasoning += `Desvantagem de ${Math.abs(destructionDifference).toFixed(1)}% em destruição. `;
    }

    if (attackEfficiency > opponentAttackEfficiency) {
      reasoning += `Melhor eficiência de ataques (${(attackEfficiency * 100).toFixed(0)}% vs ${(opponentAttackEfficiency * 100).toFixed(0)}%).`;
    } else if (attackEfficiency < opponentAttackEfficiency) {
      reasoning += `Menor eficiência de ataques (${(attackEfficiency * 100).toFixed(0)}% vs ${(opponentAttackEfficiency * 100).toFixed(0)}%).`;
    }

    return {
      clanWinProbability: Math.round(clanWinProbability),
      opponentWinProbability: Math.round(opponentWinProbability),
      tieProbability: Math.round(tieProbability),
      reasoning: reasoning.trim(),
    };
  }

  /**
   * Identifica quem fechou a guerra (último ataque de 3 estrelas que atingiu o máximo de estrelas)
   * Segue a lógica: rastreia estrelas por defensor, só conta o melhor ataque por defensor
   * Se um defensor já tiver 3 estrelas, ignora ataques subsequentes nele
   */
  findWarCloser(war: CurrentWarData, clanTag: string): ThreeStarAttack | null {
    if (!war.clan || !war.opponent) return null;

    const cleanClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const isOurClan = war.clan.tag.toUpperCase() === cleanClanTag.toUpperCase();
    const ourClan = isOurClan ? war.clan : war.opponent;
    const enemyClan = isOurClan ? war.opponent : war.clan;

    // Calcula o tamanho da equipe (teamSize ou número de membros)
    const teamSize = war.teamSize || ourClan.members?.length || 0;
    const maxStars = teamSize * 3; // Máximo de estrelas possíveis
    
    // Se não conseguir determinar o tamanho da equipe, não pode fechar a guerra
    if (teamSize === 0 || maxStars === 0) {
      return null;
    }

    // Coleta todos os ataques do nosso clan
    const allAttacks: Array<{
      attackerTag: string;
      attackerName: string;
      defenderTag: string;
      defenderName: string;
      stars: number;
      destructionPercentage: number;
      order: number;
      duration: number;
    }> = [];

    if (ourClan.members) {
      for (const member of ourClan.members) {
        if (member.attacks) {
          for (const attack of member.attacks) {
            // Encontra o nome do defensor
            const defender = enemyClan.members?.find((m) => m.tag === attack.defenderTag);
            if (defender) {
              allAttacks.push({
                attackerTag: member.tag,
                attackerName: member.name,
                defenderTag: attack.defenderTag,
                defenderName: defender.name,
                stars: attack.stars,
                destructionPercentage: attack.destructionPercentage,
                order: attack.order,
                duration: attack.duration,
              });
            }
          }
        }
      }
    }

    // Ordena por ordem de ataque
    allAttacks.sort((a, b) => a.order - b.order);

    // Rastreia as estrelas de cada defensor (inicializa com 0)
    const defenderStars: Record<string, number> = {};
    if (enemyClan.members) {
      for (const member of enemyClan.members) {
        defenderStars[member.tag] = 0;
      }
    }

    let totalStars = 0;
    let warCloser: ThreeStarAttack | null = null;

    // Processa cada ataque em ordem
    for (const attack of allAttacks) {
      const currentDefenderStars = defenderStars[attack.defenderTag] || 0;
      
      // Se o ataque é de 3 estrelas e o defensor ainda não tem 3 estrelas
      if (attack.stars === 3 && currentDefenderStars < 3) {
        // Atualiza para 3 estrelas (primeiro ataque de 3 estrelas conta)
        const previousStars = currentDefenderStars;
        defenderStars[attack.defenderTag] = 3;
        totalStars = totalStars - previousStars + 3;

        // Verifica se chegou ao máximo de estrelas
        if (totalStars === maxStars) {
          warCloser = {
            attackerTag: attack.attackerTag,
            attackerName: attack.attackerName,
            defenderTag: attack.defenderTag,
            defenderName: attack.defenderName,
            stars: attack.stars,
            destructionPercentage: attack.destructionPercentage,
            order: attack.order,
            duration: attack.duration,
            isClanAttack: true,
          };
          break; // Encontrou quem fechou, para de procurar
        }
      } else if (attack.stars < 3) {
        // Para ataques menores que 3 estrelas, só atualiza se:
        // 1. O defensor ainda não tem 3 estrelas (não foi fechado)
        // 2. O novo ataque é melhor que o anterior
        if (currentDefenderStars < 3 && attack.stars > currentDefenderStars) {
          const previousStars = currentDefenderStars;
          defenderStars[attack.defenderTag] = attack.stars;
          totalStars = totalStars - previousStars + attack.stars;
        }
      }
      // Se o ataque é de 3 estrelas mas o defensor já tem 3 estrelas, não conta (ignora)
    }

    // Verifica também ataques do oponente (caso o oponente tenha fechado)
    if (!warCloser) {
      const opponentAttacks: Array<{
        attackerTag: string;
        attackerName: string;
        defenderTag: string;
        defenderName: string;
        stars: number;
        destructionPercentage: number;
        order: number;
        duration: number;
      }> = [];

      if (enemyClan.members) {
        for (const member of enemyClan.members) {
          if (member.attacks) {
            for (const attack of member.attacks) {
              const defender = ourClan.members?.find((m) => m.tag === attack.defenderTag);
              if (defender) {
                opponentAttacks.push({
                  attackerTag: member.tag,
                  attackerName: member.name,
                  defenderTag: attack.defenderTag,
                  defenderName: defender.name,
                  stars: attack.stars,
                  destructionPercentage: attack.destructionPercentage,
                  order: attack.order,
                  duration: attack.duration,
                });
              }
            }
          }
        }
      }

      opponentAttacks.sort((a, b) => a.order - b.order);

      const opponentDefenderStars: Record<string, number> = {};
      if (ourClan.members) {
        for (const member of ourClan.members) {
          opponentDefenderStars[member.tag] = 0;
        }
      }

      let opponentTotalStars = 0;

      for (const attack of opponentAttacks) {
        const currentDefenderStars = opponentDefenderStars[attack.defenderTag] || 0;
        
        if (attack.stars === 3 && currentDefenderStars < 3) {
          const previousStars = currentDefenderStars;
          opponentDefenderStars[attack.defenderTag] = 3;
          opponentTotalStars = opponentTotalStars - previousStars + 3;

          if (opponentTotalStars === maxStars) {
            warCloser = {
              attackerTag: attack.attackerTag,
              attackerName: attack.attackerName,
              defenderTag: attack.defenderTag,
              defenderName: attack.defenderName,
              stars: attack.stars,
              destructionPercentage: attack.destructionPercentage,
              order: attack.order,
              duration: attack.duration,
              isClanAttack: false,
            };
            break;
          }
        } else if (attack.stars < 3) {
          if (currentDefenderStars < 3 && attack.stars > currentDefenderStars) {
            const previousStars = currentDefenderStars;
            opponentDefenderStars[attack.defenderTag] = attack.stars;
            opponentTotalStars = opponentTotalStars - previousStars + attack.stars;
          }
        }
      }
    }

    return warCloser;
  }

  /**
   * Coleta todos os ataques de 3 estrelas
   * Conta apenas o primeiro ataque de 3 estrelas por defensor
   */
  getThreeStarAttacks(war: CurrentWarData, clanTag: string): ThreeStarAttack[] {
    if (!war.clan || !war.opponent) return [];

    const cleanClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const isOurClan = war.clan.tag.toUpperCase() === cleanClanTag.toUpperCase();
    const ourClan = isOurClan ? war.clan : war.opponent;
    const enemyClan = isOurClan ? war.opponent : war.clan;

    const threeStarAttacks: ThreeStarAttack[] = [];
    // Rastreia quais defensores já receberam 3 estrelas (só conta o primeiro)
    const defendersWithThreeStars = new Set<string>();

    // Coleta todos os ataques de 3 estrelas
    const allThreeStarAttacks: Array<{
      attackerTag: string;
      attackerName: string;
      defenderTag: string;
      defenderName: string;
      stars: number;
      destructionPercentage: number;
      order: number;
      duration: number;
      isClanAttack: boolean;
    }> = [];

    // Processa ataques do nosso clan
    if (ourClan.members) {
      for (const member of ourClan.members) {
        if (member.attacks) {
          for (const attack of member.attacks) {
            if (attack.stars === 3) {
              const defender = enemyClan.members?.find((m) => m.tag === attack.defenderTag);
              const defenderName = defender?.name || "Desconhecido";

              allThreeStarAttacks.push({
                attackerTag: member.tag,
                attackerName: member.name,
                defenderTag: attack.defenderTag,
                defenderName: defenderName,
                stars: attack.stars,
                destructionPercentage: attack.destructionPercentage,
                order: attack.order,
                duration: attack.duration,
                isClanAttack: true,
              });
            }
          }
        }
      }
    }

    // Processa ataques do oponente
    if (enemyClan.members) {
      for (const member of enemyClan.members) {
        if (member.attacks) {
          for (const attack of member.attacks) {
            if (attack.stars === 3) {
              const defender = ourClan.members?.find((m) => m.tag === attack.defenderTag);
              const defenderName = defender?.name || "Desconhecido";

              allThreeStarAttacks.push({
                attackerTag: member.tag,
                attackerName: member.name,
                defenderTag: attack.defenderTag,
                defenderName: defenderName,
                stars: attack.stars,
                destructionPercentage: attack.destructionPercentage,
                order: attack.order,
                duration: attack.duration,
                isClanAttack: false,
              });
            }
          }
        }
      }
    }

    // Ordena por ordem (ordem do ataque)
    allThreeStarAttacks.sort((a, b) => a.order - b.order);

    // Filtra apenas o primeiro ataque de 3 estrelas por defensor
    for (const attack of allThreeStarAttacks) {
      if (!defendersWithThreeStars.has(attack.defenderTag)) {
        defendersWithThreeStars.add(attack.defenderTag);
        threeStarAttacks.push({
          attackerTag: attack.attackerTag,
          attackerName: attack.attackerName,
          defenderTag: attack.defenderTag,
          defenderName: attack.defenderName,
          stars: attack.stars,
          destructionPercentage: attack.destructionPercentage,
          order: attack.order,
          duration: attack.duration,
          isClanAttack: attack.isClanAttack,
        });
      }
    }

    return threeStarAttacks;
  }

  /**
   * Cria timeline da guerra com todos os ataques
   */
  createTimeline(war: CurrentWarData, clanTag: string): WarTimelineEvent[] {
    if (!war.clan || !war.opponent) return [];

    const cleanClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const isOurClan = war.clan.tag.toUpperCase() === cleanClanTag.toUpperCase();
    const ourClan = isOurClan ? war.clan : war.opponent;
    const enemyClan = isOurClan ? war.opponent : war.clan;

    const timeline: WarTimelineEvent[] = [];

    // Rastreia estrelas acumuladas
    let ourStars = 0;
    let enemyStars = 0;

    // Rastreia quais defensores já receberam 3 estrelas (só conta o primeiro)
    const defendersWithThreeStars = new Set<string>();

    // Coleta todos os ataques
    const allAttacks: Array<{
      attackerTag: string;
      attackerName: string;
      defenderTag: string;
      defenderName: string;
      stars: number;
      destructionPercentage: number;
      order: number;
      isClanAttack: boolean;
    }> = [];

    // Processa ataques do nosso clan
    if (ourClan.members) {
      for (const member of ourClan.members) {
        if (member.attacks) {
          for (const attack of member.attacks) {
            const defender = enemyClan.members?.find((m) => m.tag === attack.defenderTag);
            const defenderName = defender?.name || "Desconhecido";

            allAttacks.push({
              attackerTag: member.tag,
              attackerName: member.name,
              defenderTag: attack.defenderTag,
              defenderName: defenderName,
              stars: attack.stars,
              destructionPercentage: attack.destructionPercentage,
              order: attack.order,
              isClanAttack: true,
            });
          }
        }
      }
    }

    // Processa ataques do oponente
    if (enemyClan.members) {
      for (const member of enemyClan.members) {
        if (member.attacks) {
          for (const attack of member.attacks) {
            const defender = ourClan.members?.find((m) => m.tag === attack.defenderTag);
            const defenderName = defender?.name || "Desconhecido";

            allAttacks.push({
              attackerTag: member.tag,
              attackerName: member.name,
              defenderTag: attack.defenderTag,
              defenderName: defenderName,
              stars: attack.stars,
              destructionPercentage: attack.destructionPercentage,
              order: attack.order,
              isClanAttack: false,
            });
          }
        }
      }
    }

    // Ordena por ordem
    allAttacks.sort((a, b) => a.order - b.order);

    // Cria eventos da timeline
    for (const attack of allAttacks) {
      // Verifica se o defensor já recebeu 3 estrelas (só conta o primeiro)
      let starsToAdd = attack.stars;
      if (attack.stars === 3 && defendersWithThreeStars.has(attack.defenderTag)) {
        // Este defensor já recebeu 3 estrelas, não conta
        starsToAdd = 0;
      } else if (attack.stars === 3) {
        defendersWithThreeStars.add(attack.defenderTag);
      }

      // Adiciona estrelas
      if (attack.isClanAttack) {
        ourStars += starsToAdd;
      } else {
        enemyStars += starsToAdd;
      }

      timeline.push({
        type: attack.isClanAttack ? "attack" : "defense",
        attackerTag: attack.attackerTag,
        attackerName: attack.attackerName,
        defenderTag: attack.defenderTag,
        defenderName: attack.defenderName,
        stars: starsToAdd, // Usa starsToAdd (pode ser 0 se já tiver 3 estrelas)
        destructionPercentage: attack.destructionPercentage,
        order: attack.order,
        isClanAttack: attack.isClanAttack,
        clanStarsAfter: ourStars,
        opponentStarsAfter: enemyStars,
      });
    }

    return timeline;
  }

  /**
   * Calcula o status da guerra baseado nas estrelas e no estado
   */
  calculateWarStatus(war: CurrentWarData, clanTag: string): WarStatus {
    if (!war.clan || !war.opponent) {
      return {
        status: "notInWar",
        label: "Não está em guerra",
      };
    }

    const cleanClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const isOurClan = war.clan.tag.toUpperCase() === cleanClanTag.toUpperCase();
    const ourClan = isOurClan ? war.clan : war.opponent;
    const enemyClan = isOurClan ? war.opponent : war.clan;

    const ourStars = ourClan.stars || 0;
    const enemyStars = enemyClan.stars || 0;

    // Se a guerra ainda não começou (preparation)
    if (war.state === "preparation") {
      return {
        status: "preparation",
        label: "Preparação",
      };
    }

    // Se a guerra terminou (warEnded)
    if (war.state === "warEnded") {
      if (ourStars > enemyStars) {
        return {
          status: "won",
          label: "Ganhou",
        };
      } else if (ourStars < enemyStars) {
        return {
          status: "lost",
          label: "Perdeu",
        };
      } else {
        return {
          status: "tie",
          label: "Empate",
        };
      }
    }

    // Se a guerra está em andamento (inWar)
    if (war.state === "inWar") {
      if (ourStars > enemyStars) {
        return {
          status: "winning",
          label: "Ganhando",
        };
      } else if (ourStars < enemyStars) {
        return {
          status: "losing",
          label: "Perdendo",
        };
      } else {
        return {
          status: "tied",
          label: "Empatado",
        };
      }
    }

    // Estado desconhecido ou notInWar
    return {
      status: "notInWar",
      label: "Não está em guerra",
    };
  }

  /**
   * Analisa a guerra atual e retorna todos os dados processados
   */
  async analyzeCurrentWar(clanTag: string): Promise<CurrentWarAnalysis | null> {
    const war = await this.getCurrentWar(clanTag);

    if (!war || war.state === "notInWar") {
      return null;
    }

    const prediction = this.calculatePrediction(war);
    const warStatus = this.calculateWarStatus(war, clanTag);
    const warCloser = this.findWarCloser(war, clanTag);
    const threeStarAttacks = this.getThreeStarAttacks(war, clanTag);
    const timeline = this.createTimeline(war, clanTag);

    return {
      war,
      prediction,
      warStatus,
      warCloser: warCloser || undefined,
      threeStarAttacks,
      timeline,
    };
  }
}

