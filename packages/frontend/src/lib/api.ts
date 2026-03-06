// Funções auxiliares para chamadas de API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function fetchClanData(tag: string, cookies?: string, useCache: boolean = true) {
  const cleanTag = tag.startsWith("#") ? tag.replace("#", "") : tag;
  
  // Tenta buscar do cache primeiro (apenas no cliente)
  if (useCache && typeof window !== "undefined") {
    const { getCachedClanData, setCachedClanData } = await import("./clan-cache");
    const cached = getCachedClanData(cleanTag);
    if (cached) {
      return cached;
    }
  }

  const response = await fetch(`${API_URL}/clans/search/${encodeURIComponent(cleanTag)}`, {
    headers: cookies
      ? {
          Cookie: cookies,
        }
      : undefined,
    credentials: "include", // Inclui cookies automaticamente no cliente
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar clan" }));
    throw new Error(error.message || "Erro ao buscar clan");
  }

  const data = await response.json();

  // Salva no cache (apenas no cliente)
  if (useCache && typeof window !== "undefined") {
    const { setCachedClanData } = await import("./clan-cache");
    setCachedClanData(cleanTag, data);
  }

  return data;
}

export async function getSession(cookieHeader?: string) {
  const response = await fetch(`${API_URL}/auth/get-session`, {
    headers: cookieHeader
      ? {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        },
    credentials: "include", // Inclui cookies automaticamente no cliente
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getOrganizations(cookieHeader?: string) {
  // Usa nossa API customizada que retorna organizations com members incluídos
  const response = await fetch(`${API_URL}/organizations/list`, {
    headers: cookieHeader
      ? {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        },
    credentials: "include", // Inclui cookies automaticamente no cliente
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  // Retorna no formato esperado (data ou diretamente o array)
  return result.data || result;
}

export interface PlayerStats {
  tag: string;
  name: string;
  totalAttacks: number;
  totalStars: number;
  totalDestruction: number;
  averageStars: number;
  averageDestruction: number;
  bayesianScore: number;
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

export interface CWLPlayerStats {
  tag: string;
  name: string;
  totalAttacks: number;
  totalStars: number;
  totalDestruction: number;
  averageStars: number;
  averageDestruction: number;
  bayesianScore: number;
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

export async function getWarRanking(
  clanTag: string,
  months: Array<{ year: number; month: number }>,
  useCache: boolean = true
): Promise<PlayerStats[]> {
  const cleanTag = clanTag.startsWith("#") ? clanTag.replace("#", "") : clanTag;
  const monthsKey = months
    .map((m) => `${m.year}-${m.month}`)
    .sort()
    .join(",");
  const cacheKey = `${cleanTag}_${monthsKey}`;

  // Tenta buscar do cache primeiro (apenas no cliente)
  if (useCache && typeof window !== "undefined") {
    const { getCachedWarData, setCachedWarData } = await import("./war-cache");
    const cached = getCachedWarData(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const monthsParam = months
    .map((m) => `${m.year}-${m.month}`)
    .join(",");

  const url = `${API_URL}/wars/ranking/${encodeURIComponent(cleanTag)}?months=${encodeURIComponent(monthsParam)}`;

  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar ranking" }));
    throw new Error(error.message || "Erro ao buscar ranking");
  }

  const result = await response.json();
  const data = result.data || [];

  // Salva no cache (apenas no cliente)
  if (useCache && typeof window !== "undefined") {
    const { setCachedWarData } = await import("./war-cache");
    setCachedWarData(cacheKey, data);
  }

  return data;
}

export async function getClansByOrganization(
  organizationId: string,
  cookieHeader?: string
) {
  const response = await fetch(
    `${API_URL}/clans/organization/${encodeURIComponent(organizationId)}`,
    {
      headers: cookieHeader
        ? {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
          }
        : {
            "Content-Type": "application/json",
          },
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function createClan(
  organizationId: string,
  clanTag: string,
  clanData: any,
  cookieHeader?: string
) {
  const response = await fetch(`${API_URL}/clans/create`, {
    method: "POST",
    headers: cookieHeader
      ? {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        },
    credentials: "include",
    body: JSON.stringify({
      organizationId,
      clanTag,
      clanData,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao criar clan" }));
    throw new Error(error.message || "Erro ao criar clan");
  }

  return response.json();
}

export async function getCWLRanking(
  clanTag: string,
  months: Array<{ year: number; month: number }>,
  useCache: boolean = true
): Promise<CWLPlayerStats[]> {
  const cleanTag = clanTag.startsWith("#") ? clanTag.replace("#", "") : clanTag;
  const seasonsKey = months
    .map((m) => `${m.year}-${String(m.month).padStart(2, "0")}`)
    .sort()
    .join(",");
  const cacheKey = `${cleanTag}_${seasonsKey}`;

  // Tenta buscar do cache primeiro (apenas no cliente)
  if (useCache && typeof window !== "undefined") {
    const { getCachedCWLData, setCachedCWLData } = await import("./cwl-cache");
    const cached = getCachedCWLData(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const seasonsParam = months
    .map((m) => `${m.year}-${m.month}`)
    .join(",");

  const url = `${API_URL}/cwl/ranking/${encodeURIComponent(cleanTag)}?seasons=${encodeURIComponent(seasonsParam)}`;

  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar ranking de CWL" }));
    throw new Error(error.message || "Erro ao buscar ranking de CWL");
  }

  const result = await response.json();
  let data = result.data || [];

  // Normaliza os dados para garantir que warsParticipated sempre existe
  data = data.map((player: any) => {
    // Converte seasonsParticipated antigo para warsParticipated se necessário
    if (player.seasonsParticipated !== undefined && player.seasonsParticipated !== null) {
      player.warsParticipated = player.seasonsParticipated;
      delete player.seasonsParticipated;
    }
    
    // Se não tiver warsParticipated, usa totalAttacks como fallback (1 ataque por guerra na CWL)
    if (player.warsParticipated === undefined || player.warsParticipated === null) {
      player.warsParticipated = player.totalAttacks || 0;
    }
    return player;
  });

  // Salva no cache (apenas no cliente)
  if (useCache && typeof window !== "undefined") {
    const { setCachedCWLData } = await import("./cwl-cache");
    setCachedCWLData(cacheKey, data);
  }

  return data;
}

export interface CurrentWarAnalysis {
  war: {
    state: string;
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
      members: Array<any>;
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
      members: Array<any>;
    };
  };
  prediction: {
    clanWinProbability: number;
    opponentWinProbability: number;
    tieProbability: number;
    reasoning: string;
  };
  warStatus: {
    status: "winning" | "tied" | "losing" | "won" | "tie" | "lost" | "preparation" | "notInWar";
    label: string;
  };
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
  threeStarAttacks: Array<{
    attackerTag: string;
    attackerName: string;
    defenderTag: string;
    defenderName: string;
    stars: number;
    destructionPercentage: number;
    order: number;
    duration: number;
    isClanAttack: boolean;
  }>;
  timeline: Array<{
    type: "attack" | "defense";
    attackerTag: string;
    attackerName: string;
    defenderTag: string;
    defenderName: string;
    stars: number;
    destructionPercentage: number;
    order: number;
    isClanAttack: boolean;
    clanStarsAfter: number;
    opponentStarsAfter: number;
  }>;
}

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
  group: {
    state: string;
    season: string;
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
  };
  currentRound?: number;
  currentWar?: {
    state: string;
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
  };
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

export interface ClanTownHalls {
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
}

export async function getCurrentCWL(clanTag: string): Promise<CurrentCWLAnalysis> {
  const cleanTag = clanTag.startsWith("#") ? clanTag.replace("#", "") : clanTag;
  
  const response = await fetch(`${API_URL}/current-cwl/${encodeURIComponent(cleanTag)}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar CWL atual" }));
    throw new Error(error.message || "Erro ao buscar CWL atual");
  }

  return response.json();
}

export async function getCWLWar(warTag: string): Promise<CurrentCWLAnalysis["currentWar"]> {
  const cleanTag = warTag.startsWith("#") ? warTag.replace("#", "") : warTag;
  
  const response = await fetch(`${API_URL}/current-cwl/war/${encodeURIComponent(cleanTag)}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar guerra CWL" }));
    throw new Error(error.message || "Erro ao buscar guerra CWL");
  }

  return response.json();
}

export async function getClansTownHalls(clanTag: string): Promise<ClanTownHalls[]> {
  const cleanTag = clanTag.startsWith("#") ? clanTag.replace("#", "") : clanTag;
  
  const response = await fetch(`${API_URL}/current-cwl/${encodeURIComponent(cleanTag)}/townhalls`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar Town Halls dos clãs" }));
    throw new Error(error.message || "Erro ao buscar Town Halls dos clãs");
  }

  return response.json();
}

export async function getCurrentWar(clanTag: string): Promise<CurrentWarAnalysis> {
  const cleanTag = clanTag.startsWith("#") ? clanTag.replace("#", "") : clanTag;

  const url = `${API_URL}/current-war/${encodeURIComponent(cleanTag)}`;

  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar guerra atual" }));
    throw new Error(error.message || "Erro ao buscar guerra atual");
  }

  const result = await response.json();
  return result.data;
}

export interface PlayerPushLog {
  id: string;
  type: string;
  trophiesChange: number;
  previousTrophies: number;
  currentTrophies: number;
  createdAt: Date;
}

export interface PlayerPushStats {
  tag: string;
  name: string;
  currentTrophies: number;
  totalAttack: number;
  totalDefense: number;
  attackCount: number;
  defenseCount: number;
  logs: PlayerPushLog[];
}

export async function getPlayerPushLogs(clanTag: string): Promise<PlayerPushStats[]> {
  const cleanTag = clanTag.startsWith("#") ? clanTag.replace("#", "") : clanTag;

  const url = `${API_URL}/player-push/clan/${encodeURIComponent(cleanTag)}`;

  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar logs de player push" }));
    throw new Error(error.message || "Erro ao buscar logs de player push");
  }

  const result = await response.json();
  return result.data || [];
}

// Invites API
export interface Invite {
  id: string;
  organizationId: string;
  userId: string;
  invitedBy: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

export async function sendInvite(organizationId: string, userId: string) {
  const response = await fetch(`${API_URL}/invites/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ organizationId, userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao enviar convite" }));
    throw new Error(error.message || "Erro ao enviar convite");
  }

  return response.json();
}

export async function acceptInvite(inviteId: string) {
  const response = await fetch(`${API_URL}/invites/${inviteId}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao aceitar convite" }));
    throw new Error(error.message || "Erro ao aceitar convite");
  }

  return response.json();
}

export async function rejectInvite(inviteId: string) {
  const response = await fetch(`${API_URL}/invites/${inviteId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao rejeitar convite" }));
    throw new Error(error.message || "Erro ao rejeitar convite");
  }

  return response.json();
}

export async function cancelInvite(inviteId: string) {
  const response = await fetch(`${API_URL}/invites/${inviteId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao cancelar convite" }));
    throw new Error(error.message || "Erro ao cancelar convite");
  }

  return response.json();
}

export async function getInvitesByOrganization(organizationId: string): Promise<Invite[]> {
  const response = await fetch(`${API_URL}/invites/organization/${organizationId}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar convites" }));
    throw new Error(error.message || "Erro ao buscar convites");
  }

  const result = await response.json();
  return result.data || [];
}

export async function getPendingInvites(): Promise<Invite[]> {
  const response = await fetch(`${API_URL}/invites/pending`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar convites pendentes" }));
    throw new Error(error.message || "Erro ao buscar convites pendentes");
  }

  const result = await response.json();
  return result.data || [];
}

export async function searchUsersByEmail(email: string) {
  const response = await fetch(`${API_URL}/invites/search-users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar usuários" }));
    throw new Error(error.message || "Erro ao buscar usuários");
  }

  const result = await response.json();
  return result.data || [];
}

export async function removeMember(organizationId: string, userId: string) {
  const response = await fetch(`${API_URL}/members/organization/${organizationId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao remover membro" }));
    throw new Error(error.message || "Erro ao remover membro");
  }

  return response.json();
}

export async function updateOrganization(organizationId: string, data: { name?: string; slug?: string }) {
  const response = await fetch(`${API_URL}/organizations/${organizationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao atualizar organização" }));
    throw new Error(error.message || "Erro ao atualizar organização");
  }

  return response.json();
}

export async function deleteOrganization(organizationId: string) {
  const response = await fetch(`${API_URL}/organizations/${organizationId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao deletar organização" }));
    throw new Error(error.message || "Erro ao deletar organização");
  }

  return response.json();
}

export async function removeClan(clanId: string) {
  const response = await fetch(`${API_URL}/clans/${clanId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao remover clan" }));
    throw new Error(error.message || "Erro ao remover clan");
  }

  return response.json();
}

export async function getSubscription(organizationId: string, cookieHeader?: string) {
  const response = await fetch(`${API_URL}/subscriptions/organization/${organizationId}`, {
    headers: cookieHeader
      ? {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function createOrganizationWithManualSubscription(data: {
  name: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  daysUntilExpiry: number;
}) {
  const response = await fetch(`${API_URL}/admin/organizations/create-with-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao criar organização" }));
    throw new Error(error.message || "Erro ao criar organização");
  }

  return response.json();
}

export async function reactivateSubscription(organizationId: string, daysUntilExpiry: number) {
  const response = await fetch(`${API_URL}/admin/organizations/${organizationId}/reactivate-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ daysUntilExpiry }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao reativar assinatura" }));
    throw new Error(error.message || "Erro ao reativar assinatura");
  }

  return response.json();
}

export async function renewSubscription(organizationId: string) {
  const response = await fetch(`${API_URL}/stripe/renew-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ organizationId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao renovar assinatura" }));
    throw new Error(error.message || "Erro ao renovar assinatura");
  }

  return response.json();
}

export interface PlayerWarHistory {
  warEndTime: string;
  warType: "war" | "cwl" | "friendly";
  clanTag: string;
  clanName: string;
  opponentTag: string;
  opponentName: string;
  stars: number;
  destructionPercentage: number;
  attacks: Array<{
    defenderTag: string;
    defenderName: string;
    stars: number;
    destructionPercentage: number;
    order: number;
    duration: number;
  }>;
  result: "win" | "loss" | "tie";
}

export interface PlayerStats {
  player: any;
  warHistory: PlayerWarHistory[];
  cwlHistory: PlayerWarHistory[];
  friendlyHistory: PlayerWarHistory[];
  totalStats: {
    wars: {
      total: number;
      wins: number;
      losses: number;
      ties: number;
      totalStars: number;
      totalDestruction: number;
      averageStars: number;
      averageDestruction: number;
    };
    cwl: {
      total: number;
      wins: number;
      losses: number;
      ties: number;
      totalStars: number;
      totalDestruction: number;
      averageStars: number;
      averageDestruction: number;
    };
    friendly: {
      total: number;
      wins: number;
      losses: number;
      ties: number;
      totalStars: number;
      totalDestruction: number;
      averageStars: number;
      averageDestruction: number;
    };
  };
}

export async function getPlayer(playerTag: string, cookies?: string): Promise<PlayerStats> {
  const cleanTag = playerTag.startsWith("#") ? playerTag.replace("#", "") : playerTag;
  const response = await fetch(`${API_URL}/player/${encodeURIComponent(cleanTag)}`, {
    headers: cookies ? { Cookie: cookies } : undefined,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar jogador" }));
    throw new Error(error.message || "Erro ao buscar jogador");
  }

  const responseData = await response.json();
  // O backend retorna { success: true, data: {...} }
  const data = responseData.data || responseData;
  
  return data;
}

export async function getPlayerBasic(playerTag: string): Promise<any> {
  const cleanTag = playerTag.startsWith("#") ? playerTag.replace("#", "") : playerTag;
  const response = await fetch(`${API_URL}/player/${encodeURIComponent(cleanTag)}/basic`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao buscar jogador" }));
    throw new Error(error.message || "Erro ao buscar jogador");
  }

  const data = await response.json();
  return data.data;
}