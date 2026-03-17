"use client";

import { cn } from "@/lib/utils";

interface DayFilterProps {
  days: string[];
  selectedDay: string | null;
  onDayChange: (day: string | null) => void;
}

export function DayFilter({ days, selectedDay, onDayChange }: DayFilterProps) {
  if (days.length === 0) return null;

  return (
    <div className="space-y-2 mb-5">
      <p className="text-xs font-medium text-muted-foreground">Dia</p>
      <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-x-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {days.map((day) => {
          const selected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => onDayChange(day)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
