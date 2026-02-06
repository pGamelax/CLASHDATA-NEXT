"use client";

import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MonthFilterProps {
  availableMonths: Array<{ year: number; month: number; label: string }>;
  selectedMonths: Array<{ year: number; month: number }>;
  onMonthsChange: (months: Array<{ year: number; month: number }>) => void;
}

export function MonthFilter({
  availableMonths,
  selectedMonths,
  onMonthsChange,
}: MonthFilterProps) {
  const handleMonthToggle = (year: number, month: number) => {
    const exists = selectedMonths.some((m) => m.year === year && m.month === month);
    if (exists) {
      onMonthsChange(selectedMonths.filter((m) => !(m.year === year && m.month === month)));
    } else {
      onMonthsChange([...selectedMonths, { year, month }]);
    }
  };

  const removeMonth = (year: number, month: number) => {
    onMonthsChange(selectedMonths.filter((m) => !(m.year === year && m.month === month)));
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
      <Select
        value=""
        onValueChange={(value) => {
          if (value) {
            const [year, month] = value.split("-").map(Number);
            handleMonthToggle(year, month);
          }
        }}
      >
        <SelectTrigger className="w-full sm:w-[200px] text-xs sm:text-sm">
          <SelectValue placeholder="Adicionar mês..." />
        </SelectTrigger>
        <SelectContent>
          {availableMonths.map(({ year, month, label }) => {
            const isSelected = selectedMonths.some(
              (m) => m.year === year && m.month === month
            );
            return (
              <SelectItem
                key={`${year}-${month}`}
                value={`${year}-${month}`}
                disabled={isSelected}
                className="text-xs sm:text-sm"
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {selectedMonths.length > 0 && (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {selectedMonths.map(({ year, month }) => {
            const monthData = availableMonths.find(
              (m) => m.year === year && m.month === month
            );
            return (
              <Badge
                key={`${year}-${month}`}
                variant="secondary"
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5"
              >
                <span className="truncate max-w-[120px] sm:max-w-none">{monthData?.label || `${year}-${month}`}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-destructive/20 flex-shrink-0"
                  onClick={() => removeMonth(year, month)}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

