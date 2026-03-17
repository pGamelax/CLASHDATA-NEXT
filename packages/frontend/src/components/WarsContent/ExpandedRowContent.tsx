"use client";

import type { PlayerStats } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  player: PlayerStats;
}

function parseWarDate(warEndTime: string | number): Date {
  if (typeof warEndTime === "number") {
    return new Date(warEndTime < 1e12 ? warEndTime * 1000 : warEndTime);
  }
  const compact = warEndTime.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d+)Z$/);
  if (compact) {
    const [, y, mo, d, h, mi, s, ms] = compact;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}.${ms}Z`);
  }
  return new Date(warEndTime);
}

function formatDate(raw: string | number): string {
  const date = parseWarDate(raw);
  const y = date.getFullYear();
  if (isNaN(date.getTime()) || y < 2000 || y > 2100) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function ExpandedRowContent({ player }: Props) {
  const sorted = [...player.attacks].sort(
    (a, b) => parseWarDate(b.warEndTime).getTime() - parseWarDate(a.warEndTime).getTime()
  );

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
            key={`${attack.warEndTime}-${attack.defenderTag}-${i}`}
            className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2 rounded-lg bg-background border"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{attack.opponentClanName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(attack.warEndTime)}</p>
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
