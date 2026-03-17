"use client";

import { useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlayerDetails, PlayerWarHistory } from "@/lib/api";
import {
  Star,
  Users,
  Building2,
  Shield,
  ArrowUp,
  Swords,
  Hammer,
  Sparkles,
  Trophy,
  Sword,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerDetailsContentProps {
  playerData: PlayerDetails;
}

const ROLE_LABELS: Record<string, string> = {
  leader: "Líder",
  coLeader: "Co-líder",
  admin: "Elder",
  member: "Membro",
};

function StatItem({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-xl border bg-card">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </div>
      <p className="text-xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ProgressBar({
  label,
  current,
  max,
  color = "primary",
}: {
  label: string;
  current: number;
  max: number;
  color?: "primary" | "amber" | "purple" | "blue";
}) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  const barColors = {
    primary: "bg-primary",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">
          {current.toLocaleString()} / {max.toLocaleString()}{" "}
          <span className="font-semibold text-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const RESULT_CONFIG = {
  win: { label: "Vitória", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  loss: { label: "Derrota", className: "bg-destructive/10 text-destructive border-destructive/20" },
  tie: { label: "Empate", className: "bg-muted text-muted-foreground border-border" },
};

function formatWarDate(dateString: string) {
  if (!dateString) return "N/A";
  try {
    const compact = dateString.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    const iso = compact
      ? `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}.000Z`
      : dateString;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  } catch {
    return "N/A";
  }
}

function WarAttacks({ attacks }: { attacks: PlayerWarHistory["attacks"] }) {
  if (!attacks || attacks.length === 0) {
    return <p className="text-sm text-muted-foreground px-1">Nenhum ataque registrado</p>;
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Ataques ({attacks.length})
      </p>
      {[...attacks]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((attack, i) => (
          <div
            key={`${attack.defenderTag}-${i}`}
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 border text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground shrink-0">#{attack.order ?? i + 1}</span>
              <span className="font-medium truncate">{attack.defenderName ?? attack.defenderTag}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs">
              <span className="font-semibold">{attack.stars} ⭐</span>
              <span className="text-muted-foreground">{attack.destructionPercentage.toFixed(1)}%</span>
              {attack.duration != null && (
                <span className="text-muted-foreground hidden sm:block">
                  {Math.floor(attack.duration / 60)}:{(attack.duration % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

function WarCard({ war }: { war: PlayerWarHistory }) {
  const [expanded, setExpanded] = useState(false);
  const result = RESULT_CONFIG[war.result] ?? RESULT_CONFIG.tie;

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <button
        type="button"
        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                  result.className
                )}
              >
                {result.label}
              </span>
              <span className="text-xs text-muted-foreground">{formatWarDate(war.warEndTime)}</span>
            </div>
            <p className="text-sm font-medium leading-snug">
              <span className="text-foreground">{war.clanName ?? war.clanTag}</span>
              <span className="text-muted-foreground mx-1.5">vs</span>
              <span className="text-foreground">{war.opponentName ?? war.opponentTag}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-sm">
            <div className="text-center">
              <p className="font-bold">{war.stars} ⭐</p>
              <p className="text-[10px] text-muted-foreground">estrelas</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{war.destructionPercentage.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">destruição</p>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-3">
          <WarAttacks attacks={war.attacks} />
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 10;

function WarHistoryList({ data, empty }: { data: PlayerWarHistory[]; empty: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = data.filter((w) => {
    const q = search.toLowerCase();
    return (
      (w.clanName ?? w.clanTag).toLowerCase().includes(q) ||
      (w.opponentName ?? w.opponentTag).toLowerCase().includes(q)
    );
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Filtrar por clã ou oponente..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {paged.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          {search ? "Nenhum resultado para esta busca" : empty}
        </div>
      ) : (
        <div className="space-y-2">
          {paged.map((war, i) => (
            <WarCard key={`${war.warEndTime}-${i}`} war={war} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Página {safePage + 1} de {pageCount}
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

export function PlayerDetailsContent({ playerData }: PlayerDetailsContentProps) {
  const { player, warHistory, cwlHistory, friendlyHistory, totalStats } = playerData;

  // Progress: total levels vs max levels for home village
  const progress = (() => {
    if (!player.heroes || !player.troops || !player.spells) return null;
    const homeHeroes = player.heroes.filter((h: any) => h.village === "home");
    const homeTroops = player.troops.filter((t: any) => t.village === "home");
    const homeSpells = player.spells.filter((s: any) => s.village === "home");
    const sum = (arr: any[], key: string) =>
      arr.reduce((acc: number, x: any) => acc + (x[key] || 0), 0);
    return {
      heroes: { current: sum(homeHeroes, "level"), max: sum(homeHeroes, "maxLevel") },
      troops: { current: sum(homeTroops, "level"), max: sum(homeTroops, "maxLevel") },
      spells: { current: sum(homeSpells, "level"), max: sum(homeSpells, "maxLevel") },
    };
  })();

  const thImage =
    player.townHallLevel >= 3 && player.townHallLevel <= 18
      ? `/townhall/th${player.townHallLevel}_min.png`
      : null;

  return (
    <div className="w-full space-y-6">

      {/* Player header */}
      <Card className="overflow-hidden">
        <div className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">

            {/* Visuals: TH + league */}
            <div className="flex items-center gap-3 shrink-0">
              {thImage && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted/50 border flex items-center justify-center">
                  <Image
                    src={thImage}
                    alt={`Town Hall ${player.townHallLevel}`}
                    width={80}
                    height={80}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              {player.league?.iconUrls?.medium && (
                <img
                  src={player.league.iconUrls.medium}
                  alt={player.league.name ?? "Liga"}
                  className="w-16 h-16"
                />
              )}
            </div>

            {/* Name + info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold truncate">{player.name}</h1>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{player.tag}</p>
              </div>

              {/* Badges: TH / BC / level / clan / role / war pref */}
              <div className="flex flex-wrap gap-2">
                {player.townHallLevel && (
                  <Badge className="gap-1.5 px-3 py-1">
                    <Shield className="h-3.5 w-3.5" />
                    CV {player.townHallLevel}
                  </Badge>
                )}
                {player.builderHallLevel && (
                  <Badge className="gap-1.5 px-3 py-1">
                    <Building2 className="h-3.5 w-3.5" />
                    BC {player.builderHallLevel}
                  </Badge>
                )}
                {player.expLevel !== undefined && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <Star className="h-3.5 w-3.5" />
                    Nível {player.expLevel}
                  </Badge>
                )}
                {player.clan && (
                  <Badge variant="outline" className="gap-1.5 px-3 py-1">
                    {player.clan.badgeUrls?.small && (
                      <img
                        src={player.clan.badgeUrls.small}
                        alt={player.clan.name}
                        className="w-4 h-4"
                      />
                    )}
                    {player.clan.name}
                  </Badge>
                )}
                {player.role && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {ROLE_LABELS[player.role] ?? player.role}
                  </Badge>
                )}
                {player.warPreference && (
                  <Badge
                    variant={player.warPreference === "in" ? "default" : "secondary"}
                    className="px-3 py-1"
                  >
                    {player.warPreference === "in" ? "Na guerra" : "Fora da guerra"}
                  </Badge>
                )}
              </div>

              {/* League name + legend rank */}
              {(player.league?.name || player.legendStatistics?.currentSeason?.rank) && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {player.league?.name && <span>{player.league.name}</span>}
                  {player.legendStatistics?.currentSeason?.rank && (
                    <span className="font-semibold text-foreground">
                      #{player.legendStatistics.currentSeason.rank.toLocaleString()}
                    </span>
                  )}
                  {player.builderBaseLeague?.name && (
                    <span>{player.builderBaseLeague.name}</span>
                  )}
                </div>
              )}

              {/* Labels */}
              {player.labels && player.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {player.labels.map((label: any) => (
                    <Badge key={label.id} variant="outline" className="gap-1.5 px-2 py-1 text-xs">
                      {label.iconUrls?.small && (
                        <img src={label.iconUrls.small} alt={label.name} className="w-3.5 h-3.5" />
                      )}
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {player.trophies !== undefined && (
          <StatItem
            icon={Trophy}
            label="Troféus"
            value={player.trophies.toLocaleString()}
            sub={
              player.bestTrophies !== undefined
                ? `Recorde: ${player.bestTrophies.toLocaleString()}`
                : undefined
            }
          />
        )}
        {player.legendStatistics?.legendTrophies !== undefined && (
          <StatItem
            icon={Sparkles}
            label="Troféus Lendários"
            value={player.legendStatistics.legendTrophies.toLocaleString()}
          />
        )}
        {player.builderBaseTrophies !== undefined && (
          <StatItem
            icon={Hammer}
            label="Troféus Builder"
            value={player.builderBaseTrophies.toLocaleString()}
            sub={
              player.bestBuilderBaseTrophies !== undefined
                ? `Recorde: ${player.bestBuilderBaseTrophies.toLocaleString()}`
                : undefined
            }
          />
        )}
        {player.warStars !== undefined && (
          <StatItem
            icon={Star}
            label="Estrelas de Guerra"
            value={player.warStars.toLocaleString()}
          />
        )}
        {player.attackWins !== undefined && (
          <StatItem
            icon={Swords}
            label="Vitórias Ataque"
            value={player.attackWins.toLocaleString()}
          />
        )}
        {player.defenseWins !== undefined && (
          <StatItem
            icon={Shield}
            label="Vitórias Defesa"
            value={player.defenseWins.toLocaleString()}
          />
        )}
        {player.donations !== undefined && (
          <StatItem
            icon={ArrowUp}
            label="Doações Enviadas"
            value={player.donations.toLocaleString()}
            sub={
              player.donationsReceived !== undefined
                ? `Recebidas: ${player.donationsReceived.toLocaleString()}`
                : undefined
            }
          />
        )}
        {player.clanCapitalContributions !== undefined && (
          <StatItem
            icon={Building2}
            label="Capital do Clã"
            value={player.clanCapitalContributions.toLocaleString()}
          />
        )}
      </div>

      {/* Upgrade progress */}
      {progress && (progress.heroes.max > 0 || progress.troops.max > 0 || progress.spells.max > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Progresso de Upgrade
            </CardTitle>
            <CardDescription className="text-xs">
              Nível atual vs nível máximo da aldeia principal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress.heroes.max > 0 && (
              <ProgressBar
                label="Heróis"
                current={progress.heroes.current}
                max={progress.heroes.max}
                color="amber"
              />
            )}
            {progress.troops.max > 0 && (
              <ProgressBar
                label="Tropas"
                current={progress.troops.current}
                max={progress.troops.max}
                color="blue"
              />
            )}
            {progress.spells.max > 0 && (
              <ProgressBar
                label="Feitiços"
                current={progress.spells.current}
                max={progress.spells.max}
                color="purple"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall war stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Estatísticas de Guerra
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left py-2.5 px-4 font-semibold">Tipo</th>
                  <th className="text-center py-2.5 px-3 font-semibold">Total</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-green-600 dark:text-green-400">V</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-destructive">D</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">E</th>
                  <th className="text-center py-2.5 px-3 font-semibold hidden sm:table-cell">Média ⭐</th>
                  <th className="text-center py-2.5 px-3 font-semibold hidden sm:table-cell">Média %</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    { label: "Guerras", stats: totalStats.wars },
                    { label: "CWL", stats: totalStats.cwl },
                    { label: "Amistosas", stats: totalStats.friendly },
                  ] as const
                ).map(({ label, stats }, i, arr) => (
                  <tr
                    key={label}
                    className={cn("hover:bg-muted/30 transition-colors", i < arr.length - 1 && "border-b")}
                  >
                    <td className="py-2.5 px-4 font-medium">{label}</td>
                    <td className="text-center py-2.5 px-3">{stats.total}</td>
                    <td className="text-center py-2.5 px-3 font-semibold text-green-600 dark:text-green-400">
                      {stats.wins}
                    </td>
                    <td className="text-center py-2.5 px-3 font-semibold text-destructive">
                      {stats.losses}
                    </td>
                    <td className="text-center py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">
                      {stats.ties}
                    </td>
                    <td className="text-center py-2.5 px-3 hidden sm:table-cell">
                      {stats.averageStars.toFixed(1)}
                    </td>
                    <td className="text-center py-2.5 px-3 hidden sm:table-cell">
                      {stats.averageDestruction.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* War history tabs */}
      <Tabs defaultValue="wars" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wars">
            Guerras ({warHistory.length})
          </TabsTrigger>
          <TabsTrigger value="cwl">
            CWL ({cwlHistory.length})
          </TabsTrigger>
          <TabsTrigger value="friendly">
            Amistosas ({friendlyHistory.length})
          </TabsTrigger>
        </TabsList>

        {(
          [
            {
              key: "wars",
              title: "Guerras Aleatórias",
              desc: "Guerras aleatórias em que o jogador participou",
              data: warHistory,
              empty: "Nenhuma guerra aleatória encontrada",
            },
            {
              key: "cwl",
              title: "CWL",
              desc: "Guerras de CWL em que o jogador participou",
              data: cwlHistory,
              empty: "Nenhuma guerra de CWL encontrada",
            },
            {
              key: "friendly",
              title: "Amistosas",
              desc: "Guerras amistosas em que o jogador participou",
              data: friendlyHistory,
              empty: "Nenhuma guerra amistosa encontrada",
            },
          ] as const
        ).map(({ key, title, desc, data, empty }) => (
          <TabsContent key={key} value={key} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-xs">{desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <WarHistoryList data={data as PlayerWarHistory[]} empty={empty} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
