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

  const res = await apiFetch<any>(`/clans/search/${encodeURIComponent(cleanTag)}`, { cookies });
  const data = res?.data ?? res;

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

export async function getMyClans(cookieHeader?: string) {
  try {
    const result = await apiFetch<any>("/clans/my", { cookies: cookieHeader });
    return result?.data || result?.clans || result;
  } catch {
    return null;
  }
}

export async function getClanByTag(tag: string, cookieHeader?: string) {
  try {
    const cleanTag = stripHash(tag);
    return await apiFetch<any>(`/clans/tag/${encodeURIComponent(cleanTag)}`, { cookies: cookieHeader });
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

export async function createClan(clanTag: string, clanData: any, cookieHeader?: string) {
  return apiFetch<any>("/clans/create", {
    method: "POST",
    body: JSON.stringify({ clanTag, clanData }),
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

export async function getPlayerPushLogs(
  clanTag: string,
  cookies?: string,
  from?: Date,
  to?: Date
): Promise<PlayerPushStats[]> {
  const cleanTag = stripHash(clanTag);
  const params = new URLSearchParams();
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());
  const qs = params.toString();
  const result = await apiFetch<{ data: PlayerPushStats[] }>(
    `/player-push/clan/${encodeURIComponent(cleanTag)}${qs ? `?${qs}` : ""}`,
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
  globalRank?: number | null;
}

export interface SeasonSnapshot {
  id: string;
  seasonEndDateId: string;
  clanTag: string;
  clanName: string;
  clanId: string;
  players: SeasonSnapshotPlayer[];
  capturedAt: string;
  seasonEndDate: SeasonEndDate;
}

export async function getSeasonEndDates(cookies?: string): Promise<SeasonEndDate[]> {
  const result = await apiFetch<{ data: SeasonEndDate[] }>("/admin/season-dates", { cookies });
  return result.data || [];
}

export async function getPublicSeasonDates(): Promise<{ id: string; date: string; label?: string | null }[]> {
  try {
    const result = await apiFetch<{ data: { id: string; date: string; label?: string | null }[] }>("/season-dates");
    return result.data || [];
  } catch {
    return [];
  }
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


export async function removeClan(clanId: string) {
  return apiFetch<any>(`/clans/${clanId}`, { method: "DELETE" });
}

export async function getSubscription(clanId: string, cookieHeader?: string) {
  try {
    return await apiFetch<any>(
      `/subscriptions/clan/${clanId}`,
      { cookies: cookieHeader }
    );
  } catch {
    return null;
  }
}

export async function manageSubscription(data: {
  ownerEmail: string;
  newStatus: "ACTIVE" | "EXPIRED" | "CANCELLED";
  activeUntil?: string;
  clanTag?: string;
  plan?: string;
}) {
  return apiFetch<any>("/admin/subscriptions/manage", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function reactivateSubscription(clanId: string, daysUntilExpiry: number) {
  return apiFetch<any>(`/admin/clans/${clanId}/reactivate-subscription`, {
    method: "POST",
    body: JSON.stringify({ daysUntilExpiry }),
  });
}

// --- Plans ---

export interface PlanConfig {
  id: string;
  key: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  originalQuarterlyPrice: number | null;
  originalYearlyPrice: number | null;
  icon: string;
  color: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

export async function getPlans(): Promise<PlanConfig[]> {
  try {
    const data = await apiFetch<{ plans: PlanConfig[] }>("/subscriptions/plans");
    return data.plans ?? [];
  } catch {
    return [];
  }
}

export async function getAdminPlans(): Promise<PlanConfig[]> {
  try {
    const data = await apiFetch<{ plans: PlanConfig[] }>("/admin/plans");
    return data.plans ?? [];
  } catch {
    return [];
  }
}

export async function createAdminPlan(data: Partial<PlanConfig>): Promise<PlanConfig> {
  const res = await apiFetch<{ plan: PlanConfig }>("/admin/plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.plan;
}

export async function updateAdminPlan(id: string, data: Partial<PlanConfig>): Promise<PlanConfig> {
  const res = await apiFetch<{ plan: PlanConfig }>(`/admin/plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.plan;
}

export async function deleteAdminPlan(id: string): Promise<void> {
  await apiFetch(`/admin/plans/${id}`, { method: "DELETE" });
}

export async function seedAdminPlans(): Promise<{ seeded: boolean; count: number }> {
  const res = await apiFetch<{ seeded: boolean; count: number }>("/admin/plans/seed", { method: "POST" });
  return res;
}

// --- PIX / SyncPay ---

export interface PixPaymentData {
  pendingId?: string;     // presente no fluxo de criação de novo clan
  pixId: string;
  pixCode: string;        // copia e cola
  pixQrCodeBase64: string;
  pixExpiresAt: string;
  amount: number;         // centavos
  status?: string;
  periodFrom?: string;
  periodTo?: string;
}

export async function checkTrialStatus(): Promise<{ hasUsedTrial: boolean }> {
  try {
    return await apiFetch<{ hasUsedTrial: boolean }>("/pix/check-trial");
  } catch {
    return { hasUsedTrial: false };
  }
}

export async function createClanWithTrial(data: {
  clanTag: string;
  plan: string;
  period: string;
}): Promise<{
  // Fluxo trial (clan criado imediatamente)
  clan?: { id: string; tag: string; name: string };
  subscription?: { id: string; status: string; trialEndsAt?: string };
  // Fluxo PIX (clan criado após webhook)
  requiresPayment?: boolean;
  pix?: PixPaymentData | null;
}> {
  return apiFetch<any>("/pix/create-clan", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPendingClanStatus(): Promise<{
  pending: { id: string; status: string; clanTag: string } | null;
}> {
  try {
    return await apiFetch<any>("/pix/pending-clan");
  } catch {
    return { pending: null };
  }
}

export async function createPixPayment(data: {
  clanId: string;
  plan: string;
  period: string;
  upgradeOnly?: boolean;
}): Promise<{ pix: PixPaymentData }> {
  return apiFetch<any>("/pix/create-payment", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function scheduleDowngrade(data: {
  clanId: string;
  plan: string;
}): Promise<{ success: boolean; pendingPlan: string; effectiveAt?: string }> {
  return apiFetch<any>("/pix/downgrade", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPixStatus(clanId: string): Promise<{
  pix: PixPaymentData | null;
}> {
  return apiFetch<any>(`/pix/status/${clanId}`);
}

export interface Subscription {
  id: string;
  plan: string;
  status: "TRIAL" | "ACTIVE" | "CANCELLED" | "EXPIRED";
  period?: string;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  pendingPlan?: string | null;
  isActive: boolean;
  paymentProvider?: string | null;
}

export async function getPlayer(playerTag: string, cookies?: string): Promise<PlayerDetails> {
  const cleanTag = stripHash(playerTag);
  const responseData = await apiFetch<{ data?: PlayerDetails } | PlayerDetails>(
    `/player/${encodeURIComponent(cleanTag)}`,
    { cookies }
  );
  return (responseData as any).data || responseData;
}

export interface PublicClanRank {
  tag: string;
  clanTag: string;
  name: string;
  badgeUrls: { small: string; medium: string; large: string } | null;
  clanLevel: number | null;
  clanPoints: number | null;
  members: number | null;
  owner?: { name: string; email: string };
}

export async function getPublicClanRanking(): Promise<PublicClanRank[]> {
  try {
    const result = await apiFetch<{ data: PublicClanRank[] }>("/clans/ranking");
    return result.data || [];
  } catch {
    return [];
  }
}

export async function getPlayerBasic(playerTag: string): Promise<any> {
  const cleanTag = stripHash(playerTag);
  const data = await apiFetch<{ data: any }>(`/player/${encodeURIComponent(cleanTag)}/basic`);
  return data.data;
}
