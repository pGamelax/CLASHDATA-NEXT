import { env } from "../env";

export interface ClanData {
  tag: string;
  name: string;
  type: string;
  description?: string;
  location?: {
    id: number;
    name: string;
    isCountry: boolean;
    countryCode: string;
  };
  badgeUrls?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  clanLevel: number;
  clanPoints: number;
  clanBuilderBasePoints?: number;
  clanCapitalPoints?: number;
  capitalLeague?: {
    id: number;
    name: string;
  };
  requiredTrophies?: number;
  warFrequency?: string;
  warWinStreak?: number;
  warWins?: number;
  warTies?: number;
  warLosses?: number;
  isWarLogPublic?: boolean;
  warLeague?: {
    id: number;
    name: string;
  };
  members: number;
  memberList?: Array<any>;
}

export class ClashOfClansService {
  private readonly baseUrl = "https://api.clashofclans.com/v1";
  private readonly token = env.TOKEN_COC;

  async searchClanByTag(tag: string): Promise<ClanData> {
    const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
    const encodedTag = encodeURIComponent(cleanTag);

    const response = await fetch(`${this.baseUrl}/clans/${encodedTag}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Erro ao buscar clan: ${response.statusText}`;
      try {
        const errorData = (await response.json()) as any;
        errorMessage = errorData.reason || errorData.message || errorMessage;
      } catch {
        // Se não conseguir parsear o JSON de erro, usa a mensagem padrão
      }

      if (response.status === 404) {
        throw new Error("Clan não encontrado");
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia da API do Clash of Clans");
    }

    let clanData: any;
    try {
      clanData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError, "Response:", responseText);
      throw new Error("Resposta inválida da API do Clash of Clans");
    }

    return {
      tag: clanData.tag,
      name: clanData.name,
      type: clanData.type,
      description: clanData.description || "",
      location: clanData.location,
      badgeUrls: clanData.badgeUrls,
      clanLevel: clanData.clanLevel,
      clanPoints: clanData.clanPoints,
      clanBuilderBasePoints: clanData.clanBuilderBasePoints || 0,
      clanCapitalPoints: clanData.clanCapitalPoints || 0,
      capitalLeague: clanData.capitalLeague || null,
      requiredTrophies: clanData.requiredTrophies || 0,
      warFrequency: clanData.warFrequency || "never",
      warWinStreak: clanData.warWinStreak || 0,
      warWins: clanData.warWins || 0,
      warTies: clanData.warTies || 0,
      warLosses: clanData.warLosses || 0,
      isWarLogPublic: clanData.isWarLogPublic || false,
      warLeague: clanData.warLeague || null,
      members: clanData.members || 0,
      memberList: clanData.memberList || [],
    };
  }

  async getClanMembers(tag: string): Promise<any> {
    const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
    const encodedTag = encodeURIComponent(cleanTag);

    const response = await fetch(`${this.baseUrl}/clans/${encodedTag}/members`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Erro ao buscar membros do clan: ${response.statusText}`;
      try {
        const errorData = (await response.json()) as any;
        errorMessage = errorData.reason || errorData.message || errorMessage;
      } catch {
        // Se não conseguir parsear o JSON de erro, usa a mensagem padrão
      }

      if (response.status === 404) {
        throw new Error("Clan não encontrado");
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia da API do Clash of Clans");
    }

    let membersData: any;
    try {
      membersData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError, "Response:", responseText);
      throw new Error("Resposta inválida da API do Clash of Clans");
    }

    return membersData;
  }

  async getLegendRankings(locationId: number | string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/rankings/${locationId}/legends?limit=200`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    if (!response.ok) return { items: [] };
    const text = await response.text();
    if (!text || text.trim() === "") return { items: [] };
    try {
      return JSON.parse(text);
    } catch {
      return { items: [] };
    }
  }

  async getPlayerByTag(tag: string): Promise<any> {
    const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
    const encodedTag = encodeURIComponent(cleanTag);

    const response = await fetch(`${this.baseUrl}/players/${encodedTag}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Erro ao buscar player: ${response.statusText}`;
      try {
        const errorData = (await response.json()) as any;
        errorMessage = errorData.reason || errorData.message || errorMessage;
      } catch {
        // Se não conseguir parsear o JSON de erro, usa a mensagem padrão
      }

      if (response.status === 404) {
        throw new Error("Player não encontrado");
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia da API do Clash of Clans");
    }

    let playerData: any;
    try {
      playerData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError, "Response:", responseText);
      throw new Error("Resposta inválida da API do Clash of Clans");
    }

    return playerData;
  }
}

