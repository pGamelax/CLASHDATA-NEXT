"use client";

import { Swords, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PlayerPushStats, PlayerPushLog } from "@/lib/api";

import { filterLogsByDay } from "./utils";

interface ExpandedRowContentProps {
  player: PlayerPushStats;
  selectedDay?: string | null;
}

function LogCard({ log, isAttack }: { log: any; isAttack: boolean }) {
  const date = new Date(log.createdAt);
  const formattedDate = date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`relative border rounded-md p-2 transition-all flex-1 ${
        isAttack
          ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
          : "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={`text-xs font-semibold px-1.5 py-0.5 ${
            isAttack
              ? "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30"
              : "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
          }`}
        >
          {isAttack ? "+" : "-"}
          {log.trophiesChange}
        </Badge>
        <div className="w-full flex flex-col sm:flex-row  sm:justify-between sm:items-center gap-1 ">
          <span className="text-xs text-muted-foreground">
            {log.previousTrophies.toLocaleString("pt-BR")} →{" "}
            {log.currentTrophies.toLocaleString("pt-BR")}
          </span>
          <span className="text-[10px] text-muted-foreground/70 ml-auto">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ExpandedRowContent({
  player,
  selectedDay,
}: ExpandedRowContentProps) {
  // Filtra logs por dia se houver seleção
  const filteredLogs = selectedDay
    ? filterLogsByDay(player.logs, selectedDay)
    : player.logs;

  // Separa logs por tipo e ordena por data (mais recente primeiro)
  const attackLogs = [...filteredLogs]
    .filter((log) => log.type === "attack")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const defenseLogs = [...filteredLogs]
    .filter((log) => log.type === "defense")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  // Determina o número máximo de pares
  const maxPairs = Math.max(attackLogs.length, defenseLogs.length);

  return (
    <div className="p-2 muted/10">
      {maxPairs > 0 ? (
        <div className="space-y-1.5">
          {Array.from({ length: maxPairs }).map((_, index) => {
            const attack = attackLogs[index];
            const defense = defenseLogs[index];

            return (
              <div key={index} className="grid grid-cols-2 gap-1">
                {attack ? (
                  <LogCard log={attack} isAttack={true} />
                ) : (
                  <div className="flex-1" />
                )}
                {defense ? (
                  <LogCard log={defense} isAttack={false} />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-[10px] text-muted-foreground">
          Nenhum log registrado
        </div>
      )}
    </div>
  );
}
