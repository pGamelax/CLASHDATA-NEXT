"use client";

import type { CWLPlayerStats } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  player: CWLPlayerStats;
}

function formatSeason(season: string): string {
  const [year, month] = season.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const mon = date.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
  return `${mon.charAt(0).toUpperCase() + mon.slice(1)}/${String(year).slice(2)}`;
}

export function ExpandedRowContent({ player }: Props) {
  const sorted = [...player.attacks].sort((a, b) => b.season.localeCompare(a.season));

  if (sorted.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhum ataque registrado
      </div>
    );
  }

  return (
    <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
      {sorted.map((attack, i) => {
        const perfect = attack.stars === 3 && attack.destructionPercentage === 100;
        return (
          <div
            key={`${attack.season}-${attack.defenderTag}-${i}`}
            className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2 rounded-lg bg-background border"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{attack.opponentClanName}</p>
              <p className="text-xs text-muted-foreground">{formatSeason(attack.season)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-sm font-bold", perfect && "text-primary")}>
                {attack.stars === 0 ? "0⭐" : "⭐".repeat(attack.stars)}
              </p>
              <p className="text-xs text-muted-foreground">{attack.destructionPercentage.toFixed(0)}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
