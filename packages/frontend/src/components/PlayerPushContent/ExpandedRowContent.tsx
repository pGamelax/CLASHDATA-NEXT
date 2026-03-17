"use client";

import { Swords, Shield } from "lucide-react";
import type { PlayerPushStats } from "@/lib/api";
import { filterLogsByDay } from "./utils";
import { cn } from "@/lib/utils";

interface ExpandedRowContentProps {
  player: PlayerPushStats;
  selectedDay?: string | null;
}

function LogCard({ log, isAttack }: { log: any; isAttack: boolean }) {
  const date = new Date(log.createdAt);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 flex items-center gap-2 transition-colors",
        isAttack
          ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
          : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 rounded-md p-1.5",
          isAttack ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
        )}
      >
        {isAttack ? <Swords className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
      </div>

      {/* Trophy change */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-sm font-bold",
            isAttack ? "text-green-500" : "text-red-500"
          )}
        >
          {isAttack ? "+" : "-"}
          {log.trophiesChange}
        </span>
        <p className="text-xs text-muted-foreground leading-tight">
          {log.previousTrophies.toLocaleString("pt-BR")} → {log.currentTrophies.toLocaleString("pt-BR")}
        </p>
      </div>

      {/* Time */}
      <div className="text-right shrink-0">
        <p className="text-xs font-medium">{time}</p>
        <p className="text-[10px] text-muted-foreground">{day}</p>
      </div>
    </div>
  );
}

export function ExpandedRowContent({ player, selectedDay }: ExpandedRowContentProps) {
  const filteredLogs = selectedDay
    ? filterLogsByDay(player.logs, selectedDay)
    : player.logs;

  const attackLogs = [...filteredLogs]
    .filter((l) => l.type === "attack")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const defenseLogs = [...filteredLogs]
    .filter((l) => l.type === "defense")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (filteredLogs.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhum log registrado
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-green-500/5 border border-green-500/20 px-3 py-2 flex items-center gap-2">
          <Swords className="h-4 w-4 text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Ataques</p>
            <p className="text-sm font-bold text-green-500">
              +{attackLogs.reduce((s, l) => s + l.trophiesChange, 0)}{" "}
              <span className="text-xs font-normal text-muted-foreground">({attackLogs.length}×)</span>
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2 flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Defesas</p>
            <p className="text-sm font-bold text-red-500">
              -{defenseLogs.reduce((s, l) => s + l.trophiesChange, 0)}{" "}
              <span className="text-xs font-normal text-muted-foreground">({defenseLogs.length}×)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Log columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Attacks */}
        {attackLogs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ataques
            </p>
            {attackLogs.map((log) => (
              <LogCard key={log.id} log={log} isAttack={true} />
            ))}
          </div>
        )}

        {/* Defenses */}
        {defenseLogs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Defesas
            </p>
            {defenseLogs.map((log) => (
              <LogCard key={log.id} log={log} isAttack={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
