"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayFilterProps {
  days: string[];
  selectedDay: string | null;
  onDayChange: (day: string | null) => void;
}

export function DayFilter({ days, selectedDay, onDayChange }: DayFilterProps) {
  if (days.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
        {days.map((day) => (
          <Button
            key={day}
            variant={selectedDay === day ? "default" : "outline"}
            size="sm"
            onClick={() => onDayChange(day)}
            className={cn(
              "flex-shrink-0 text-xs h-8",
              selectedDay === day && "bg-primary text-primary-foreground"
            )}
          >
            {day}
          </Button>
        ))}
      </div>
    </div>
  );
}
