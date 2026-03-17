"use client";

import { useState } from "react";
import { type SeasonSnapshot, type SeasonSnapshotPlayer } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ChevronDown, ChevronUp, Calendar } from "lucide-react";
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
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PlayerRow({ player, index }: { player: SeasonSnapshotPlayer; index: number }) {
  const rank = player.rank;
  const medal = MEDAL[rank - 1];
  const isTop3 = rank <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 border-b last:border-0 transition-colors",
        isTop3 && "bg-primary/3"
      )}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        {medal ? (
          <span className="text-base leading-none">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
        )}
      </div>

      {/* Name + tag */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{player.name}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{player.tag}</p>
      </div>

      {/* Role */}
      {player.role && (
        <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
          {ROLE_LABEL[player.role] ?? player.role}
        </span>
      )}

      {/* Trophies */}
      <div className="flex items-center gap-1 shrink-0">
        <Trophy className={cn("h-3.5 w-3.5", isTop3 ? MEDAL_COLORS[rank - 1] : "text-yellow-500")} />
        <span className={cn("text-sm font-bold", isTop3 && MEDAL_COLORS[rank - 1])}>
          {player.trophies.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

function SnapshotCard({ snapshot }: { snapshot: SeasonSnapshot }) {
  const [expanded, setExpanded] = useState(false);
  const players = snapshot.players as SeasonSnapshotPlayer[];
  const leader = players.find((p) => p.role === "leader");
  const top3 = players.slice(0, 3);

  return (
    <Card>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base">
              {snapshot.seasonEndDate.label || formatDate(snapshot.seasonEndDate.date)}
            </span>
            {snapshot.seasonEndDate.label && (
              <span className="text-xs text-muted-foreground">
                {formatDate(snapshot.seasonEndDate.date)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Capturado em {formatCapturedAt(snapshot.capturedAt)}
            </span>
            <span>{players.length} jogadores</span>
          </div>
        </div>

        {/* Top 3 preview */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {top3.map((p, i) => (
            <div key={p.tag} className="text-right">
              <p className="text-xs font-semibold truncate max-w-[80px]">{p.name}</p>
              <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-0.5">
                <Trophy className="h-2.5 w-2.5 text-yellow-500" />
                {p.trophies.toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>

        <div className="shrink-0 ml-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded player list */}
      {expanded && (
        <div className="border-t">
          {players.map((player, i) => (
            <PlayerRow key={player.tag} player={player} index={i} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function SeasonEndContent({ snapshots, clanName }: SeasonEndContentProps) {
  if (snapshots.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
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
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fim de Temporada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Classificação final dos jogadores — capturada às 02:00 AM SP no término de cada temporada
        </p>
      </div>

      <div className="space-y-3">
        {snapshots.map((snapshot) => (
          <SnapshotCard key={snapshot.id} snapshot={snapshot} />
        ))}
      </div>
    </div>
  );
}
