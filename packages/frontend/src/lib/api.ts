export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

import { getCachedClanData, setCachedClanData } from "./clan-cache";
import { getCachedWarData, setCachedWarData } from "./war-cache";
import { getCachedCWLData, setCachedCWLData } from "./cwl-cache";

function stripHash(tag: string): string {
  return tag.startsWith("#") ? tag.slice(1) : tag;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { cookies?: string } = {}
): Promise<T> {
  const { cookies, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(cookies ? { Cookie: cookies } : {}),
    ...(fetchOptions.headers as Record<string, string> ?? {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro na requisição" }));
    throw new Error(error.message || "Erro na requisição");
  }

  return response.json();
}

// ---- Types ----

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
  perfectAttacks: number;
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
  warsParticipated: number;
  perfectAttacks: number;
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
      badgeUrls: { small: string; medium: string; large: string };
      clanLevel: number;
      attacks: number;
      stars: number;
      destructionPercentage: number;
      members: Array<any>;
    };
    opponent?: {
      tag: string;
      name: string;
      badgeUrls: { small: string; medium: string; large: string };
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
      badgeUrls: { small: string; medium: string; large: string };
      members: Array<{ tag: string; name: string; townHallLevel: number }>;
    }>;
    rounds: Array<{ warTags: string[] }>;
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
      badgeUrls: { small: string; medium: string; large: string };
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
      badgeUrls: { small: string; medium: string; large: string };
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
      badgeUrls: { small: string; medium: string; large: string };
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
    badgeUrls: { small: string; medium: string; large: string };
  };
  townHalls: Record<string, number>;
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
  globalRank: number | null;
  totalAttack: number;
  totalDefense: number;
  attackCount: number;
  defenseCount: number;
  logs: PlayerPushLog[];
}

export interface Invite {
  id: string;
  organizationId: string;
  userId: string;
  invitedBy: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string | null; email: string; image: string | null };
  organization?: { id: string; name: string; slug: string; logo: string | null };
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

export interface PlayerDetails {
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

// ---- API Functions ----

export async function fetchClanData(tag: string, cookies?: string, useCache = true) {
  const cleanTag = stripHash(tag);

  if (useCache) {
    const cached = getCachedClanData(cleanTag);
    if (cached) return cached;
  }

  const data = await apiFetch<any>(`/clans/search/${encodeURIComponent(cleanTag)}`, { cookies });

  if (useCache) setCachedClanData(cleanTag, data);

  return data;
}

export async function getSession(cookieHeader?: string) {
  try {
    return await apiFetch<any>("/auth/get-session", { cookies: cookieHeader });
  } catch {
    return null;
  }
}

export async function getOrganizations(cookieHeader?: string) {
  try {
    const result = await apiFetch<any>("/organizations/list", { cookies: cookieHeader });
    return result?.data || result;
  } catch {
    return null;
  }
}

export async function getWarRanking(
  clanTag: string,
  months: Array<{ year: number; month: number }>,
  useCache = true,
  cookies?: string
): Promise<PlayerStats[]> {
  const cleanTag = stripHash(clanTag);
  const monthsKey = months.map((m) => `${m.year}-${m.month}`).sort().join(",");
  const cacheKey = `${cleanTag}_${monthsKey}`;

  if (useCache) {
    const cached = getCachedWarData(cacheKey);
    if (cached) return cached;
  }

  const monthsParam = months.map((m) => `${m.year}-${m.month}`).join(",");
  const result = await apiFetch<{ data: PlayerStats[] }>(
    `/wars/ranking/${encodeURIComponent(cleanTag)}?months=${encodeURIComponent(monthsParam)}`,
    { cookies }
  );
  const data = result.data || [];

  if (useCache) setCachedWarData(cacheKey, data);

  return data;
}

export async function getClansByOrganization(organizationId: string, cookieHeader?: string) {
  try {
    return await apiFetch<any>(
      `/clans/organization/${encodeURIComponent(organizationId)}`,
      { cookies: cookieHeader }
    );
  } catch {
    return null;
  }
}

export async function createClan(
  organizationId: string,
  clanTag: string,
  clanData: any,
  cookieHeader?: string
) {
  return apiFetch<any>("/clans/create", {
    method: "POST",
    body: JSON.stringify({ organizationId, clanTag, clanData }),
    cookies: cookieHeader,
  });
}

export async function getCWLRanking(
  clanTag: string,
  months: Array<{ year: number; month: number }>,
  useCache = true,
  cookies?: string
): Promise<CWLPlayerStats[]> {
  const cleanTag = stripHash(clanTag);
  const seasonsKey = months
    .map((m) => `${m.year}-${String(m.month).padStart(2, "0")}`)
    .sort()
    .join(",");
  const cacheKey = `${cleanTag}_${seasonsKey}`;

  if (useCache) {
    const cached = getCachedCWLData(cacheKey);
    if (cached) return cached;
  }

  const seasonsParam = months.map((m) => `${m.year}-${m.month}`).join(",");
  const result = await apiFetch<{ data: CWLPlayerStats[] }>(
    `/cwl/ranking/${encodeURIComponent(cleanTag)}?seasons=${encodeURIComponent(seasonsParam)}`,
    { cookies }
  );
  let data = result.data || [];

  data = data.map((player) => {
    if ((player as any).seasonsParticipated != null) {
      player.warsParticipated = (player as any).seasonsParticipated;
      delete (player as any).seasonsParticipated;
    }
    if (player.warsParticipated == null) {
      player.warsParticipated = player.totalAttacks || 0;
    }
    return player;
  });

  if (useCache) setCachedCWLData(cacheKey, data);

  return data;
}

export async function getCurrentCWL(clanTag: string): Promise<CurrentCWLAnalysis> {
  const cleanTag = stripHash(clanTag);
  return apiFetch<CurrentCWLAnalysis>(`/current-cwl/${encodeURIComponent(cleanTag)}`);
}

export async function getCWLWar(warTag: string): Promise<CurrentCWLAnalysis["currentWar"]> {
  const cleanTag = stripHash(warTag);
  return apiFetch<CurrentCWLAnalysis["currentWar"]>(`/current-cwl/war/${encodeURIComponent(cleanTag)}`);
}

export async function getClansTownHalls(clanTag: string): Promise<ClanTownHalls[]> {
  const cleanTag = stripHash(clanTag);
  return apiFetch<ClanTownHalls[]>(`/current-cwl/${encodeURIComponent(cleanTag)}/townhalls`);
}

export async function getCurrentWar(clanTag: string, cookies?: string): Promise<CurrentWarAnalysis> {
  const cleanTag = stripHash(clanTag);
  const result = await apiFetch<{ data: CurrentWarAnalysis }>(`/current-war/${encodeURIComponent(cleanTag)}`, { cookies });
  return result.data;
}

export async function getPlayerPushLogs(clanTag: string, cookies?: string): Promise<PlayerPushStats[]> {
  const cleanTag = stripHash(clanTag);
  const result = await apiFetch<{ data: PlayerPushStats[] }>(
    `/player-push/clan/${encodeURIComponent(cleanTag)}`,
    { cookies }
  );
  return result.data || [];
}

// ── Season End Dates ──────────────────────────────────────────────────────────

export interface SeasonEndDate {
  id: string;
  date: string;
  label?: string | null;
  status: string; // PENDING | RUNNING | COMPLETED | FAILED
  jobId?: string | null;
  capturedAt?: string | null;
  createdAt: string;
  _count?: { snapshots: number };
}

export interface SeasonSnapshotPlayer {
  rank: number;
  name: string;
  tag: string;
  trophies: number;
  role?: string;
  expLevel?: number;
}

export interface SeasonSnapshot {
  id: string;
  seasonEndDateId: string;
  clanTag: string;
  clanName: string;
  organizationId: string;
  players: SeasonSnapshotPlayer[];
  capturedAt: string;
  seasonEndDate: SeasonEndDate;
}

export async function getSeasonEndDates(cookies?: string): Promise<SeasonEndDate[]> {
  const result = await apiFetch<{ data: SeasonEndDate[] }>("/admin/season-dates", { cookies });
  return result.data || [];
}

export async function createSeasonEndDate(date: string, label?: string): Promise<SeasonEndDate> {
  const result = await apiFetch<{ data: SeasonEndDate }>("/admin/season-dates", {
    method: "POST",
    body: JSON.stringify({ date, label }),
  });
  return result.data;
}

export async function deleteSeasonEndDate(id: string): Promise<void> {
  await apiFetch(`/admin/season-dates/${id}`, { method: "DELETE" });
}

export async function triggerSeasonSnapshot(id: string): Promise<void> {
  await apiFetch(`/admin/season-dates/${id}/trigger`, { method: "POST" });
}

export async function getSeasonSnapshotsByClan(
  clanTag: string,
  cookies?: string
): Promise<SeasonSnapshot[]> {
  const cleanTag = stripHash(clanTag);
  const result = await apiFetch<{ data: SeasonSnapshot[] }>(
    `/season-snapshots/clan/${encodeURIComponent(cleanTag)}`,
    { cookies }
  );
  return result.data || [];
}

export async function sendInvite(organizationId: string, userId: string) {
  return apiFetch<any>("/invites/send", {
    method: "POST",
    body: JSON.stringify({ organizationId, userId }),
  });
}

export async function acceptInvite(inviteId: string) {
  return apiFetch<any>(`/invites/${inviteId}/accept`, { method: "POST" });
}

export async function rejectInvite(inviteId: string) {
  return apiFetch<any>(`/invites/${inviteId}/reject`, { method: "POST" });
}

export async function cancelInvite(inviteId: string) {
  return apiFetch<any>(`/invites/${inviteId}`, { method: "DELETE" });
}

export async function getInvitesByOrganization(organizationId: string): Promise<Invite[]> {
  const result = await apiFetch<{ data: Invite[] }>(`/invites/organization/${organizationId}`);
  return result.data || [];
}

export async function getPendingInvites(): Promise<Invite[]> {
  const result = await apiFetch<{ data: Invite[] }>("/invites/pending");
  return result.data || [];
}

export async function searchUsersByEmail(email: string) {
  const result = await apiFetch<{ data: any[] }>("/invites/search-users", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return result.data || [];
}

export async function removeMember(organizationId: string, userId: string) {
  return apiFetch<any>(`/members/organization/${organizationId}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

export async function updateOrganization(
  organizationId: string,
  data: { name?: string; slug?: string }
) {
  return apiFetch<any>(`/organizations/${organizationId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteOrganization(organizationId: string) {
  return apiFetch<any>(`/organizations/${organizationId}`, { method: "DELETE" });
}

export async function removeClan(clanId: string) {
  return apiFetch<any>(`/clans/${clanId}`, { method: "DELETE" });
}

export async function getSubscription(organizationId: string, cookieHeader?: string) {
  try {
    return await apiFetch<any>(
      `/subscriptions/organization/${organizationId}`,
      { cookies: cookieHeader }
    );
  } catch {
    return null;
  }
}

export async function createOrganizationWithManualSubscription(data: {
  name: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  daysUntilExpiry: number;
}) {
  return apiFetch<any>("/admin/organizations/create-with-subscription", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function reactivateSubscription(organizationId: string, daysUntilExpiry: number) {
  return apiFetch<any>(`/admin/organizations/${organizationId}/reactivate-subscription`, {
    method: "POST",
    body: JSON.stringify({ daysUntilExpiry }),
  });
}

export async function renewSubscription(organizationId: string) {
  return apiFetch<any>("/stripe/renew-subscription", {
    method: "POST",
    body: JSON.stringify({ organizationId }),
  });
}

export async function createPortalSession(organizationId: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>("/stripe/create-portal-session", {
    method: "POST",
    body: JSON.stringify({ organizationId }),
  });
}

export async function createUpgradeCheckoutSession(
  organizationId: string,
  newPlan: string,
  newPeriod: string
): Promise<{ url?: string }> {
  return apiFetch<{ url?: string }>("/stripe/create-upgrade-checkout-session", {
    method: "POST",
    body: JSON.stringify({ organizationId, newPlan, newPeriod }),
  });
}

export async function changeSubscriptionPlan(
  organizationId: string,
  newPlan: string,
  newPeriod: string
): Promise<void> {
  await apiFetch<any>("/stripe/change-subscription-plan", {
    method: "POST",
    body: JSON.stringify({ organizationId, newPlan, newPeriod }),
  });
}

export interface Subscription {
  id: string;
  plan: "MESTRE" | "CAMPEAO" | "TITA" | "LEGEND";
  status: "TRIAL" | "ACTIVE" | "CANCELLED" | "EXPIRED";
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
  stripeCustomerId?: string | null;
  limits: { maxClans: number; maxInvites: number };
  usage: {
    clans: { current: number; max: number; canAdd: boolean };
    invites: { current: number; max: number; canAdd: boolean };
  };
}

export async function getPlayer(playerTag: string, cookies?: string): Promise<PlayerDetails> {
  const cleanTag = stripHash(playerTag);
  const responseData = await apiFetch<{ data?: PlayerDetails } | PlayerDetails>(
    `/player/${encodeURIComponent(cleanTag)}`,
    { cookies }
  );
  return (responseData as any).data || responseData;
}

export async function getPlayerBasic(playerTag: string): Promise<any> {
  const cleanTag = stripHash(playerTag);
  const data = await apiFetch<{ data: any }>(`/player/${encodeURIComponent(cleanTag)}/basic`);
  return data.data;
}
