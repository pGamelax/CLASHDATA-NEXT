
export function normalizeDateForDay(date: Date): Date {
  const normalized = new Date(date);
  const hour = normalized.getHours();
  if (hour < 2) {
    normalized.setDate(normalized.getDate() - 1);
  }
  
  return normalized;
}

export function getDayString(date: Date): string {
  const normalized = normalizeDateForDay(date);
  return normalized.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function isSameDay(date1: Date, date2: Date): boolean {
  const day1 = getDayString(date1);
  const day2 = getDayString(date2);
  return day1 === day2;
}

export function extractUniqueDays(logs: Array<{ createdAt: Date | string }>): string[] {
  const daysMap = new Map<string, Date>();
  
  logs.forEach((log) => {
    const date = typeof log.createdAt === "string" ? new Date(log.createdAt) : log.createdAt;
    const normalized = normalizeDateForDay(date);
    const dayString = normalized.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    if (!daysMap.has(dayString) || daysMap.get(dayString)! < normalized) {
      daysMap.set(dayString, normalized);
    }
  });
  return Array.from(daysMap.entries())
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .map(([dayString]) => dayString);
}

export function filterLogsByDay<T extends { createdAt: Date | string }>(
  logs: T[],
  selectedDay: string | null
): T[] {
  if (!selectedDay) {
    return logs;
  }
  
  return logs.filter((log) => {
    const date = typeof log.createdAt === "string" ? new Date(log.createdAt) : log.createdAt;
    const dayString = getDayString(date);
    return dayString === selectedDay;
  });
}
