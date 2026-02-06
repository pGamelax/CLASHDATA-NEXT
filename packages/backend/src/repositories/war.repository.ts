export interface WarData {
  // Campos de guerra normal
  state?: string;
  teamSize?: number;
  attacksPerMember?: number;
  battleModifier?: string;
  preparationStartTime?: string;
  startTime?: string;
  endTime?: string;
  // Campos de guerra de CWL
  warStartTime?: string;
  tag?: string; // Presente apenas em guerras de CWL
  season?: string; // Presente apenas em guerras de CWL (ex: "2026-01")
  clan: {
    tag: string;
    name: string;
    badgeUrls: {
      small: string;
      medium: string;
      large: string;
    };
    clanLevel: number;
    attacks: number;
    stars: number;
    destructionPercentage: number;
    members: Array<{
      tag: string;
      name: string;
      townhallLevel: number;
      mapPosition: number;
      attacks?: Array<{
        attackerTag: string;
        defenderTag: string;
        stars: number;
        destructionPercentage: number;
        order: number;
        duration: number;
      }>;
      opponentAttacks: number;
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
    badgeUrls: {
      small: string;
      medium: string;
      large: string;
    };
    clanLevel: number;
    attacks: number;
    stars: number;
    destructionPercentage: number;
    members: Array<any>;
  };
  status_code: number;
  timestamp: number;
  tag?: string; // Presente apenas em guerras de CWL
}

export interface WarResponse {
  items: WarData[];
}

export class WarRepository {
  private readonly baseUrl = "https://api.clashk.ing";

  async getPreviousWars(
    clanTag: string,
    timestampStart: number,
    timestampEnd: number,
    limit: number = 50
  ): Promise<WarResponse> {
    const cleanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const encodedTag = encodeURIComponent(cleanTag);

    const url = `${this.baseUrl}/war/${encodedTag}/previous?timestamp_start=${timestampStart}&timestamp_end=${timestampEnd}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = `Erro ao buscar guerras: ${response.statusText}`;
      try {
        const errorData = (await response.json()) as any;
        errorMessage = errorData.message || errorData.reason || errorMessage;
      } catch {
        // Se não conseguir parsear o JSON de erro, usa a mensagem padrão
      }

      if (response.status === 404) {
        throw new Error("Guerras não encontradas");
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia da API");
    }

    let warData: WarResponse;
    try {
      warData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError, "Response:", responseText);
      throw new Error("Resposta inválida da API");
    }

    return warData;
  }
}

