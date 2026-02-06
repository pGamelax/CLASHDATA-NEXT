import { env } from "../env";

export interface CurrentWarData {
  state: string; // "notInWar" | "preparation" | "inWar" | "warEnded"
  teamSize?: number;
  attacksPerMember?: number;
  battleModifier?: string;
  preparationStartTime?: string;
  startTime?: string;
  endTime?: string;
  clan?: {
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
  opponent?: {
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
}

export class CurrentWarRepository {
  private readonly baseUrl = "https://api.clashofclans.com/v1";
  private readonly token = env.TOKEN_COC;

  async getCurrentWar(clanTag: string): Promise<CurrentWarData | null> {
    const cleanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const encodedTag = encodeURIComponent(cleanTag);

    const response = await fetch(`${this.baseUrl}/clans/${encodedTag}/currentwar`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Erro ao buscar guerra atual: ${response.statusText}`;
      try {
        const errorData = (await response.json()) as any;
        errorMessage = errorData.reason || errorData.message || errorMessage;
      } catch {
        // Se não conseguir parsear o JSON de erro, usa a mensagem padrão
      }

      if (response.status === 404) {
        return null; // Clan não está em guerra
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      return null;
    }

    let warData: CurrentWarData;
    try {
      warData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError, "Response:", responseText);
      throw new Error("Resposta inválida da API");
    }

    return warData;
  }
}

