export interface CWLData {
  state: string;
  season: string; // Ex: "2026-01"
  clans: Array<{
    tag: string;
    name: string;
    clanLevel: number;
    badgeUrls: {
      small: string;
      medium: string;
      large: string;
    };
    stars?: number;
    destruction?: number;
    rounds?: {
      won: number;
      tied: number;
      lost: number;
    };
    members: Array<{
      tag: string;
      name: string;
      townHallLevel: number;
      attacks?: Array<{
        attackerTag: string;
        defenderTag: string;
        stars: number;
        destructionPercentage: number;
        order: number;
        duration: number;
      }>;
      opponentAttacks?: number;
      bestOpponentAttack?: {
        attackerTag: string;
        defenderTag: string;
        stars: number;
        destructionPercentage: number;
        order: number;
        duration: number;
      };
      // Campos adicionais que podem existir
      stars?: number;
      destruction?: number;
    }>;
  }>;
  // Estrutura com rounds contendo warTags (guerras completas)
  rounds?: Array<{
    warTags: Array<{
      state: string;
      teamSize?: number;
      preparationStartTime?: string;
      startTime?: string;
      endTime: string;
      warStartTime?: string;
      tag?: string;
      season?: string;
      clan: {
        tag: string;
        name: string;
        badgeUrls?: {
          small: string;
          medium: string;
          large: string;
        };
        clanLevel?: number;
        attacks?: number;
        stars?: number;
        destructionPercentage?: number;
        members: Array<{
          tag: string;
          name: string;
          townhallLevel?: number;
          mapPosition?: number;
          attacks?: Array<{
            attackerTag: string;
            defenderTag: string;
            stars: number;
            destructionPercentage: number;
            order: number;
            duration: number;
          }>;
          opponentAttacks?: number;
          bestOpponentAttack?: {
            attackerTag: string;
            defenderTag: string;
            stars: number;
            destructionPercentage: number;
            order: number;
            duration: number;
          };
        }>;
      };
      opponent: {
        tag: string;
        name: string;
        badgeUrls?: {
          small: string;
          medium: string;
          large: string;
        };
        clanLevel?: number;
        attacks?: number;
        stars?: number;
        destructionPercentage?: number;
        members?: Array<any>;
      };
    }>;
  }>;
}

export class CWLRepository {
  private readonly baseUrl = "https://api.clashk.ing";

  async getCWLBySeason(
    clanTag: string,
    season: string // Formato: "2026-01"
  ): Promise<CWLData | null> {
    const cleanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const encodedTag = encodeURIComponent(cleanTag);

    const url = `${this.baseUrl}/cwl/${encodedTag}/${season}`;

    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = `Erro ao buscar CWL: ${response.statusText}`;
      try {
        const errorData = (await response.json()) as any;
        errorMessage = errorData.message || errorData.reason || errorMessage;
      } catch {
        // Se não conseguir parsear o JSON de erro, usa a mensagem padrão
      }

      if (response.status === 404) {
        return null; // Temporada não encontrada
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      return null;
    }

    let cwlData: CWLData;
    try {
      cwlData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError, "Response:", responseText);
      throw new Error("Resposta inválida da API");
    }

    return cwlData;
  }

  /**
   * Busca múltiplas temporadas de CWL
   */
  async getCWLBySeasons(
    clanTag: string,
    seasons: string[] // Array de temporadas: ["2026-01", "2025-12", ...]
  ): Promise<CWLData[]> {
    const allCWL: CWLData[] = [];

    for (const season of seasons) {
      try {
        const cwl = await this.getCWLBySeason(clanTag, season);
        if (cwl) {
          allCWL.push(cwl);
        }
      } catch (error) {
        console.error(`Erro ao buscar CWL para temporada ${season}:`, error);
        // Continua para as próximas temporadas mesmo se uma falhar
      }
    }

    return allCWL;
  }
}

