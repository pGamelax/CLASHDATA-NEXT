import { env } from "../env";

export interface CurrentCWLGroupData {
  state: string; // "inWar" | "preparation" | "ended"
  season: string; // "2026-02"
  clans: Array<{
    tag: string;
    name: string;
    clanLevel: number;
    badgeUrls: {
      small: string;
      medium: string;
      large: string;
    };
    members: Array<{
      tag: string;
      name: string;
      townHallLevel: number;
    }>;
  }>;
  rounds: Array<{
    warTags: string[];
  }>;
}

export interface CWLWarData {
  state: string; // "preparation" | "inWar" | "warEnded"
  teamSize: number;
  preparationStartTime?: string;
  startTime?: string;
  endTime?: string;
  warStartTime?: string;
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
      opponentAttacks?: number;
      bestOpponentAttack?: {
        attackerTag: string;
        defenderTag: string;
        stars: number;
        destructionPercentage: number;
        order: number;
        duration: number;
      };
      performanceScore?: number;
    }>;
  } | null;
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
      performanceScore?: number;
    }>;
  } | null;
}

export class CurrentCWLRepository {
  private readonly baseUrl = "https://api.clashofclans.com/v1";
  private readonly token = env.TOKEN_COC;

  async getCurrentCWLGroup(clanTag: string): Promise<CurrentCWLGroupData> {
    const cleanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    const encodedTag = encodeURIComponent(cleanTag);

    const response = await fetch(
      `${this.baseUrl}/clans/${encodedTag}/currentwar/leaguegroup`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Clan não está participando de CWL no momento");
      }
      const errorText = await response.text();
      throw new Error(
        `Erro ao buscar CWL atual: ${response.status} - ${errorText}`
      );
    }

    return await response.json() as CurrentCWLGroupData;
  }

  async getCWLWar(warTag: string): Promise<CWLWarData> {
    const encodedTag = encodeURIComponent(warTag);

    const response = await fetch(
      `${this.baseUrl}/clanwarleagues/wars/${encodedTag}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Guerra não encontrada");
      }
      const errorText = await response.text();
      throw new Error(
        `Erro ao buscar guerra CWL: ${response.status} - ${errorText}`
      );
    }
    return await response.json() as CWLWarData;
  }
}
