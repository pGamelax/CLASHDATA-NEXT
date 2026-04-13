"use client";

import { useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import { toPng } from "html-to-image";
import { getPlayerPushLogs, getPublicSeasonDates, type PlayerPushStats } from "@/lib/api";
import { ExpandedRowContent } from "./PlayerPushContent/ExpandedRowContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  RefreshCw,
  Trophy,
  Swords,
  Shield,
  ChevronDown,
  ChevronUp,
  Search,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeDateForDay, getDayString } from "./PlayerPushContent/utils";

interface PlayerPushContentProps {
  clan?: any;
}

const MEDAL = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#F59E0B", "#9CA3AF", "#B45309"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the time window [from, to] for a given legend day label date. */
function getDayWindow(labelDate: Date): { from: Date; to: Date } {
  const from = new Date(labelDate);
  from.setDate(from.getDate() - 1);
  from.setHours(2, 0, 0, 0);
  const to = new Date(labelDate);
  to.setHours(1, 59, 59, 999);
  return { from, to };
}

/** Generates all legend day labels from seasonStart to today (most recent first). */
function generateSeasonDays(
  seasonStart: Date,
  today: Date
): { label: string; date: Date }[] {
  const todayLabel = normalizeDateForDay(new Date(today));
  const startLabel = normalizeDateForDay(new Date(seasonStart));
  const days: { label: string; date: Date }[] = [];
  const cur = new Date(startLabel);
  while (cur <= todayLabel) {
    days.push({
      label: cur.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      date: new Date(cur),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days.reverse();
}

// ─── Image template ──────────────────────────────────────────────────────────

function PushImageTemplate({
  data,
  clanName,
  dayLabel,
}: {
  data: PlayerPushStats[];
  clanName: string;
  dayLabel: string;
}) {
  return (
    <div style={{ width: 680, background: "#09090b", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, #eab308, #f59e0b)" }} />
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #1c1c1f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ background: "#1c1700", border: "1px solid #854d0e", borderRadius: 6, padding: "2px 8px", color: "#ca8a04", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Player Push — Legend League
          </div>
        </div>
        <div style={{ color: "#fafafa", fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{clanName}</div>
        <div style={{ color: "#52525b", fontSize: 11 }}>{dayLabel}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", padding: "6px 24px", borderBottom: "1px solid #1c1c1f", color: "#3f3f46", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        <span style={{ width: 32 }}>#</span>
        <span style={{ flex: 1 }}>Jogador</span>
        <span style={{ width: 56, textAlign: "right" }}>Global</span>
        <span style={{ width: 60, textAlign: "right" }}>Troféus</span>
        <span style={{ width: 48, textAlign: "right" }}>ATQ</span>
        <span style={{ width: 48, textAlign: "right" }}>DEF</span>
        <span style={{ width: 48, textAlign: "right" }}>Saldo</span>
      </div>
      {data.map((p, i) => {
        const isTop3 = i < 3;
        const net = p.totalAttack - p.totalDefense;
        return (
          <div key={p.tag} style={{ display: "flex", alignItems: "center", padding: "9px 24px", borderBottom: "1px solid #111113", background: isTop3 ? "rgba(234,179,8,0.05)" : i % 2 === 0 ? "#09090b" : "#0c0c0e" }}>
            <div style={{ width: 32, fontSize: isTop3 ? 15 : 12, color: isTop3 ? MEDAL_COLORS[i] : "#52525b", fontWeight: 700 }}>{isTop3 ? MEDAL[i] : `${i + 1}`}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fafafa", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
              <div style={{ color: "#3f3f46", fontSize: 10, fontFamily: "monospace" }}>{p.tag}</div>
            </div>
            <div style={{ width: 56, textAlign: "right", color: "#a78bfa", fontSize: 13, fontWeight: 600 }}>{p.globalRank != null ? `#${p.globalRank.toLocaleString("pt-BR")}` : "—"}</div>
            <div style={{ width: 60, textAlign: "right", color: "#fbbf24", fontSize: 13, fontWeight: 600 }}>{p.currentTrophies.toLocaleString("pt-BR")}</div>
            <div style={{ width: 48, textAlign: "right", color: "#4ade80", fontSize: 13, fontWeight: 600 }}>+{p.totalAttack}</div>
            <div style={{ width: 48, textAlign: "right", color: "#f87171", fontSize: 13, fontWeight: 600 }}>-{p.totalDefense}</div>
            <div style={{ width: 48, textAlign: "right", fontSize: 13, fontWeight: 700, color: net >= 0 ? "#60a5fa" : "#fb923c" }}>{net >= 0 ? "+" : ""}{net}</div>
          </div>
        );
      })}
      <div style={{ padding: "8px 24px", borderTop: "1px solid #1c1c1f", color: "#27272a", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>CLASHDATA</div>
    </div>
  );
}

// ─── PushRow ─────────────────────────────────────────────────────────────────

function PushRow({ player, rank, renderExpanded }: { player: PlayerPushStats; rank: number; renderExpanded: (p: PlayerPushStats) => ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const medal = MEDAL[rank - 1];
  const isTop3 = rank <= 3;
  const net = player.totalAttack - player.totalDefense;

  return (
    <div className={cn("rounded-xl border transition-colors", isTop3 ? "border-primary/20 bg-primary/3" : "border-border bg-card")}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setExpanded((v) => !v)}>
        <div className="w-8 shrink-0 text-center">
          {medal ? <span className="text-lg leading-none">{medal}</span> : <span className="text-sm font-bold text-muted-foreground">#{rank}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-semibold text-sm truncate">{player.name}</p>
            {player.globalRank != null && (
              <span className="shrink-0 text-[10px] text-purple-400 font-semibold bg-purple-500/10 border border-purple-500/20 rounded px-1 py-0.5 leading-none">
                #{player.globalRank.toLocaleString("pt-BR")}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate">{player.tag}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="w-16 text-right">
            <div className="flex items-center justify-end text-yellow-500 mb-0.5"><Trophy className="h-3.5 w-3.5" /></div>
            <p className="text-sm font-semibold">{player.currentTrophies.toLocaleString("pt-BR")}</p>
          </div>
          <div className="w-14 text-right">
            <div className="flex items-center justify-end text-green-500 mb-0.5"><Swords className="h-3.5 w-3.5" /></div>
            <p className="text-sm font-semibold text-green-500">+{player.totalAttack}</p>
          </div>
          <div className="w-14 text-right">
            <div className="flex items-center justify-end text-red-500 mb-0.5"><Shield className="h-3.5 w-3.5" /></div>
            <p className="text-sm font-semibold text-red-500">-{player.totalDefense}</p>
          </div>
          <div className="w-14 text-right">
            <div className="flex items-center justify-end mb-0.5"><TrendingUp className={cn("h-3.5 w-3.5", net >= 0 ? "text-blue-500" : "text-orange-500")} /></div>
            <p className={cn("text-sm font-semibold", net >= 0 ? "text-blue-500" : "text-orange-500")}>{net >= 0 ? "+" : ""}{net}</p>
          </div>
        </div>
        <div className="shrink-0 ml-1">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      <div className="sm:hidden px-4 pb-3">
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="rounded-lg bg-muted/40 px-1 py-1.5"><Trophy className="h-3 w-3 mx-auto text-yellow-500 mb-0.5" /><p className="text-xs font-semibold">{player.currentTrophies.toLocaleString("pt-BR")}</p></div>
          <div className="rounded-lg bg-muted/40 px-1 py-1.5"><Swords className="h-3 w-3 mx-auto text-green-500 mb-0.5" /><p className="text-xs font-semibold text-green-500">+{player.totalAttack}</p></div>
          <div className="rounded-lg bg-muted/40 px-1 py-1.5"><Shield className="h-3 w-3 mx-auto text-red-500 mb-0.5" /><p className="text-xs font-semibold text-red-500">-{player.totalDefense}</p></div>
          <div className="rounded-lg bg-muted/40 px-1 py-1.5"><TrendingUp className={cn("h-3 w-3 mx-auto mb-0.5", net >= 0 ? "text-blue-500" : "text-orange-500")} /><p className={cn("text-xs font-semibold", net >= 0 ? "text-blue-500" : "text-orange-500")}>{net >= 0 ? "+" : ""}{net}</p></div>
        </div>
      </div>
      {expanded && <div className="border-t bg-muted/20">{renderExpanded(player)}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlayerPushContent({ clan }: PlayerPushContentProps) {
  const clanTag = clan?.clanTag ?? clan?.tag ?? "";
  const clanName = clan?.name ?? "Clã";

  // Season days
  const [availableDays, setAvailableDays] = useState<{ label: string; date: Date }[]>([]);
  const [selectedDay, setSelectedDay] = useState<{ label: string; date: Date } | null>(null);

  // Per-day fetch state
  const [logs, setLogs] = useState<PlayerPushStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Cache: dayLabel → PlayerPushStats[]
  const cache = useRef<Map<string, PlayerPushStats[]>>(new Map());

  // Compute today's legend day label
  const todayDay = useMemo(() => {
    const now = new Date();
    const labelDate = normalizeDateForDay(now);
    return {
      label: labelDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      date: labelDate,
    };
  }, []);

  // Build season days from season start to today
  useEffect(() => {
    getPublicSeasonDates().then((dates) => {
      const today = new Date();
      let seasonStart: Date | null = null;

      if (dates.length > 0) {
        const sorted = [...dates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const past = sorted.filter((d) => new Date(d.date + "T00:00:00Z") <= today);
        const prev = past[past.length - 1];
        if (prev) seasonStart = new Date(prev.date + "T00:00:00Z");
      }

      const start = seasonStart ?? new Date(today.getFullYear(), today.getMonth(), 1);
      const days = generateSeasonDays(start, today);
      setAvailableDays(days);

      // Default to today
      const todayLabel = getDayString(today);
      const todayEntry = days.find((d) => d.label === todayLabel) ?? days[0] ?? null;
      setSelectedDay(todayEntry);
    });
  }, []);

  // Fetch data for a specific day
  const fetchDay = useCallback(async (day: { label: string; date: Date }) => {
    if (!clanTag) return;

    // Return cached
    if (cache.current.has(day.label)) {
      setLogs(cache.current.get(day.label)!);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { from, to } = getDayWindow(day.date);
      const data = await getPlayerPushLogs(clanTag.replace("#", ""), undefined, from, to);
      cache.current.set(day.label, data);
      setLogs(data);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar dados");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [clanTag]);

  // Fetch when selectedDay changes
  useEffect(() => {
    if (selectedDay) fetchDay(selectedDay);
  }, [selectedDay, fetchDay]);

  const handleDayClick = (day: { label: string; date: Date }) => {
    setSelectedDay(day);
  };

  const handleRefresh = () => {
    if (!selectedDay) return;
    cache.current.delete(selectedDay.label);
    fetchDay(selectedDay);
  };

  const displayedLogs = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter((p) => p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q));
  }, [logs, search]);

  const handleCopy = async () => {
    if (!imageRef.current) return;
    const dataUrl = await toPng(imageRef.current, { cacheBust: true, pixelRatio: 2 });
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const filename = `player-push-${selectedDay?.label ?? "today"}.png`;

    // Android / iOS: Web Share API (share sheet nativa)
    if (typeof navigator.canShare === "function") {
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }
    }

    // Desktop: tenta copiar para clipboard
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return;
    } catch {
      // clipboard não disponível, vai para download
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dayLabel = selectedDay?.label ?? todayDay.label;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Off-screen image template */}
      <div style={{ position: "absolute", left: -9999, top: -9999, pointerEvents: "none" }}>
        <div ref={imageRef}>
          <PushImageTemplate data={displayedLogs.slice(0, 10)} clanName={clanName} dayLabel={dayLabel} />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Player Push</h1>
          <p className="text-sm text-muted-foreground mt-1">Logs de push dos jogadores na Legend League</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Day filter */}
      {availableDays.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Dia</p>
          <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-x-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {availableDays.map((day) => {
              const isSelected = selectedDay?.label === day.label;
              const isToday = day.label === todayDay.label;
              return (
                <button
                  key={day.label}
                  onClick={() => handleDayClick(day)}
                  disabled={isLoading && isSelected}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
                  )}
                >
                  {day.label}
                  {isToday && !isSelected && (
                    <span className="ml-1 text-[9px] text-primary/70 font-semibold">hoje</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center space-y-3">
            <AlertCircle className="h-7 w-7 mx-auto text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Trophy className="h-8 w-8 opacity-30" />
          <p className="text-sm">Nenhum dado para {dayLabel}.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="Buscar jogador..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5 h-9">
              {copied ? (
                <><Check className="h-3.5 w-3.5 text-green-500" /><span className="hidden sm:inline text-xs">Copiado!</span></>
              ) : (
                <><Copy className="h-3.5 w-3.5" /><span className="hidden sm:inline text-xs">Copiar ranking</span></>
              )}
            </Button>
          </div>

          {search && (
            <p className="text-xs text-muted-foreground">{displayedLogs.length} de {logs.length} jogadores</p>
          )}

          <div className="space-y-2">
            {displayedLogs.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">Nenhum jogador encontrado</div>
            ) : (
              displayedLogs.map((player, i) => (
                <PushRow
                  key={player.tag}
                  player={player}
                  rank={search ? logs.findIndex((p) => p.tag === player.tag) + 1 : i + 1}
                  renderExpanded={(p) => <ExpandedRowContent player={p} selectedDay={selectedDay?.label ?? null} />}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
