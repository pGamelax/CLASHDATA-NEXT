"use client";

import { cn } from "@/lib/utils";

interface MonthFilterProps {
  availableMonths: Array<{ year: number; month: number; label: string }>;
  selectedMonths: Array<{ year: number; month: number }>;
  onMonthsChange: (months: Array<{ year: number; month: number }>) => void;
}

function shortLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  const mon = date.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
  return `${mon.charAt(0).toUpperCase() + mon.slice(1)}/${String(year).slice(2)}`;
}

export function MonthFilter({ availableMonths, selectedMonths, onMonthsChange }: MonthFilterProps) {
  const toggle = (year: number, month: number) => {
    const exists = selectedMonths.some((m) => m.year === year && m.month === month);
    if (exists) {
      onMonthsChange(selectedMonths.filter((m) => !(m.year === year && m.month === month)));
    } else {
      onMonthsChange([...selectedMonths, { year, month }]);
    }
  };

  return (
    <div className="space-y-2 mb-5">
      <p className="text-xs font-medium text-muted-foreground">Período</p>
      <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-x-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {availableMonths.map(({ year, month }) => {
          const selected = selectedMonths.some((m) => m.year === year && m.month === month);
          return (
            <button
              key={`${year}-${month}`}
              onClick={() => toggle(year, month)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
              )}
            >
              {shortLabel(year, month)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
