"use client";

import { useState } from "react";
import { type SeasonSnapshot, type SeasonSnapshotPlayer } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeasonEndContentProps {
  snapshots: SeasonSnapshot[];
  clanName: string;
}

const MEDAL = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["text-yellow-500", "text-zinc-400", "text-amber-700"];

const ROLE_LABEL: Record<string, string> = {
  leader: "Líder",
  coLeader: "Co-líder",
  admin: "Ancião",
  member: "Membro",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatCapturedAt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PlayerRow({ player, rank }: { player: SeasonSnapshotPlayer; rank: number }) {
  const medal = MEDAL[rank - 1];
  const isTop3 = rank <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
        isTop3 ? "border-primary/20 bg-primary/3" : "border-border bg-card"
      )}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        {medal ? (
          <span className="text-lg leading-none">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
        )}
      </div>

      {/* Name + tag */}
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

      {/* Role — desktop only */}
      {player.role && (
        <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
          {ROLE_LABEL[player.role] ?? player.role}
        </span>
      )}

      {/* Trophies */}
      <div className="flex items-center gap-1 shrink-0">
        <Trophy className={cn("h-3.5 w-3.5", isTop3 ? MEDAL_COLORS[rank - 1] : "text-yellow-500")} />
        <span className={cn("text-sm font-bold tabular-nums", isTop3 && MEDAL_COLORS[rank - 1])}>
          {player.trophies.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

export function SeasonEndContent({ snapshots, clanName }: SeasonEndContentProps) {
  const [selectedId, setSelectedId] = useState<string>(snapshots[0]?.id ?? "");

  const selected = snapshots.find((s) => s.id === selectedId) ?? snapshots[0];
  const players = (selected?.players ?? []) as SeasonSnapshotPlayer[];

  if (snapshots.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Fim de Temporada</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Classificação final dos jogadores no término de cada temporada
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Trophy className="h-8 w-8 opacity-30" />
          <p className="text-sm">Nenhum dado de temporada encontrado para este clã.</p>
          <p className="text-xs text-center max-w-sm">
            Os dados são capturados automaticamente às 02:00 AM no dia final de cada temporada
            configurado pelo administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Fim de Temporada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Classificação final dos jogadores na Legend League
        </p>
      </div>

      {/* Season selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Temporada</p>
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {snapshots.map((s) => {
            const isActive = s.id === selectedId;
            const label = s.seasonEndDate.label || formatDate(s.seasonEndDate.date);
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected season meta */}
      {selected && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Capturado em {formatCapturedAt(selected.capturedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {players.length} jogadores
          </span>
        </div>
      )}

      {/* Player list */}
      <div className="space-y-2">
        {players.map((player) => (
          <PlayerRow key={player.tag} player={player} rank={player.rank} />
        ))}
      </div>
    </div>
  );
}
