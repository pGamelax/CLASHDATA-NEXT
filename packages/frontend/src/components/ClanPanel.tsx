"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Trophy,
  Users,
  Shield,
  Target,
  MapPin,
  Crown,
  Swords,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchClanData } from "@/lib/api";
import { cn } from "@/lib/utils";

// ---- Types ----

interface ClanLocation {
  id: number;
  name: string;
  isCountry: boolean;
  countryCode: string;
}

interface ClanData {
  tag: string;
  name: string;
  type: string;
  description?: string;
  location?: ClanLocation;
  badgeUrls?: { small?: string; medium?: string; large?: string };
  clanLevel: number;
  clanPoints: number;
  clanBuilderBasePoints?: number;
  clanCapitalPoints?: number;
  capitalLeague?: { id: number; name: string };
  requiredTrophies?: number;
  warFrequency?: string;
  warWinStreak?: number;
  warWins?: number;
  warTies?: number;
  warLosses?: number;
  isWarLogPublic?: boolean;
  warLeague?: { id: number; name: string };
  members: number;
  memberList?: Array<{
    tag: string;
    name: string;
    role: string;
    townHallLevel: number;
    expLevel: number;
    trophies: number;
    clanRank: number;
    donations: number;
    donationsReceived: number;
  }>;
}

interface ClanPanelProps {
  initialData: ClanData;
  clanTag: string;
}

// ---- Constants ----

const WAR_FREQ_LABELS: Record<string, string> = {
  always: "Sempre",
  moreThanOncePerWeek: "Mais de 1× por semana",
  oncePerWeek: "1× por semana",
  lessThanOncePerWeek: "Menos de 1× por semana",
  never: "Nunca",
};

const CLAN_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Aberto", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  inviteOnly: { label: "A convite", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  closed: { label: "Fechado", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ROLE_LABELS: Record<string, string> = {
  leader: "Líder",
  coLeader: "Co-líder",
  admin: "Elder",
  member: "Membro",
};

const ROLE_COLORS: Record<string, string> = {
  leader: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  coLeader: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  member: "",
};

const MEMBER_PAGE_SIZE = 15;

// ---- Sub-components ----

function StatCard({
  icon: Icon,
  label,
  value,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: "primary" | "blue" | "amber" | "green";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
  };
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
      <div className={cn("p-2.5 rounded-lg shrink-0", colors[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

function MemberList({ members }: { members: NonNullable<ClanData["memberList"]> }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const sorted = [...members].sort((a, b) => a.clanRank - b.clanRank);

  const filtered = sorted.filter((m) => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / MEMBER_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * MEMBER_PAGE_SIZE, safePage * MEMBER_PAGE_SIZE + MEMBER_PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar membro..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {paged.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          {search ? "Nenhum membro encontrado" : "Sem membros"}
        </div>
      ) : (
        <div className="space-y-1.5">
          {paged.map((member) => {
            const typeConfig = CLAN_TYPE_CONFIG[member.role];
            return (
              <div
                key={member.tag}
                className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
              >
                {/* Rank */}
                <div className="w-8 shrink-0 text-center">
                  {member.clanRank <= 3 ? (
                    <Crown
                      className={cn(
                        "h-4 w-4 mx-auto",
                        member.clanRank === 1
                          ? "text-amber-400"
                          : member.clanRank === 2
                          ? "text-slate-400"
                          : "text-orange-500"
                      )}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground font-semibold">
                      #{member.clanRank}
                    </span>
                  )}
                </div>

                {/* Name + tag */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{member.tag}</p>
                </div>

                {/* TH level */}
                <Badge variant="secondary" className="text-xs shrink-0 hidden sm:flex">
                  TH{member.townHallLevel}
                </Badge>

                {/* Trophies */}
                <div className="flex items-center gap-1 shrink-0 text-sm">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-semibold">{member.trophies.toLocaleString()}</span>
                </div>

                {/* Donations */}
                <div className="hidden lg:block text-xs text-muted-foreground shrink-0 text-right">
                  <p className="font-semibold text-foreground">{member.donations.toLocaleString()}</p>
                  <p>doações</p>
                </div>

                {/* Role */}
                <span
                  className={cn(
                    "hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0",
                    ROLE_COLORS[member.role] || "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Página {safePage + 1} de {pageCount} · {filtered.length} membros
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main Component ----

export function ClanPanel({ initialData, clanTag }: ClanPanelProps) {
  const [clanData, setClanData] = useState<ClanData>(initialData);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { clearClanCache } = await import("@/lib/clan-cache");
      clearClanCache(clanTag);
      const fresh = await fetchClanData(clanTag, undefined, false);
      setClanData(fresh);
    } catch {
      // Keep existing data on error
    } finally {
      setRefreshing(false);
    }
  };

  const totalWars = (clanData.warWins ?? 0) + (clanData.warLosses ?? 0) + (clanData.warTies ?? 0);
  const winRate = totalWars > 0
    ? (((clanData.warWins ?? 0) / totalWars) * 100).toFixed(1)
    : null;

  const typeConfig = CLAN_TYPE_CONFIG[clanData.type] ?? CLAN_TYPE_CONFIG.closed;
  const hasWarStats =
    clanData.warWins !== undefined ||
    clanData.warLosses !== undefined ||
    clanData.warTies !== undefined;
  const hasLeagueInfo =
    clanData.warLeague ||
    clanData.capitalLeague ||
    clanData.warFrequency ||
    clanData.isWarLogPublic !== undefined;

  return (
    <div className="space-y-6">

      {/* Clan header */}
      <Card className="overflow-hidden">
        <div className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {clanData.badgeUrls?.large && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <Image
                  src={clanData.badgeUrls.large}
                  alt={`${clanData.name} badge`}
                  fill
                  className="object-contain"
                  sizes="96px"
                  unoptimized
                />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-bold truncate">{clanData.name}</h2>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">{clanData.tag}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="shrink-0"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                  <span className="hidden sm:inline">Atualizar</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                {clanData.location && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {clanData.location.name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  Nível {clanData.clanLevel}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {clanData.members}/50 membros
                </span>
                <span
                  className={cn(
                    "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border",
                    typeConfig.className
                  )}
                >
                  {typeConfig.label}
                </span>
              </div>

              {clanData.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {clanData.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Pontos do Clã" value={clanData.clanPoints.toLocaleString()} color="amber" />
        {clanData.clanBuilderBasePoints !== undefined && (
          <StatCard icon={Target} label="Builder Base" value={clanData.clanBuilderBasePoints.toLocaleString()} color="blue" />
        )}
        {clanData.clanCapitalPoints !== undefined && (
          <StatCard icon={Crown} label="Capital do Clã" value={clanData.clanCapitalPoints.toLocaleString()} color="primary" />
        )}
        {clanData.requiredTrophies !== undefined && (
          <StatCard icon={Award} label="Troféus Mínimos" value={clanData.requiredTrophies.toLocaleString()} color="green" />
        )}
      </div>

      {/* War stats + league info */}
      {(hasWarStats || hasLeagueInfo) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* War stats */}
          {hasWarStats && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Swords className="h-4 w-4 text-destructive" />
                  Estatísticas de Guerra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* W / L / T grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {clanData.warWins ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Vitórias</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-2xl font-bold text-destructive">
                      {clanData.warLosses ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Derrotas</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted border">
                    <p className="text-2xl font-bold">
                      {clanData.warTies ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Empates</p>
                  </div>
                </div>

                {/* Win rate bar */}
                {winRate !== null && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        Taxa de vitória
                      </span>
                      <span className="font-bold text-primary">{winRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{totalWars} guerras totais</p>
                  </div>
                )}

                {clanData.warWinStreak !== undefined && clanData.warWinStreak > 0 && (
                  <div className="flex items-center justify-between py-2 border-t">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Swords className="h-3.5 w-3.5" />
                      Sequência atual
                    </span>
                    <span className="font-bold text-amber-500">{clanData.warWinStreak}🔥</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* League & info */}
          {hasLeagueInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Ligas e Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-4">
                {clanData.warLeague && (
                  <InfoRow label="Liga de Guerra" value={clanData.warLeague.name} />
                )}
                {clanData.capitalLeague && (
                  <InfoRow label="Liga do Capital" value={clanData.capitalLeague.name} />
                )}
                {clanData.warFrequency && (
                  <InfoRow
                    label="Frequência de Guerra"
                    value={WAR_FREQ_LABELS[clanData.warFrequency] ?? clanData.warFrequency}
                  />
                )}
                {clanData.isWarLogPublic !== undefined && (
                  <InfoRow
                    label="Registro de Guerra"
                    value={clanData.isWarLogPublic ? "Público" : "Privado"}
                  />
                )}
                {clanData.members !== undefined && (
                  <InfoRow label="Membros" value={`${clanData.members} / 50`} />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Member list */}
      {clanData.memberList && clanData.memberList.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Membros ({clanData.memberList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MemberList members={clanData.memberList} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
