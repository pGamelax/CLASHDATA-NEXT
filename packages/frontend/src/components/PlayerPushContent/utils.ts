/**
 * Normaliza a data considerando que o dia começa às 02:00 AM
 * Se um log for às 01:50, ele pertence ao dia anterior
 */
export function normalizeDateForDay(date: Date): Date {
  const normalized = new Date(date);
  const hour = normalized.getHours();
  
  // Se for antes das 02:00, subtrai um dia
  if (hour < 2) {
    normalized.setDate(normalized.getDate() - 1);
  }
  
  return normalized;
}

/**
 * Retorna a string do dia no formato DD/MM
 */
export function getDayString(date: Date): string {
  const normalized = normalizeDateForDay(date);
  return normalized.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Verifica se duas datas pertencem ao mesmo dia (considerando 02:00 AM como início)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const day1 = getDayString(date1);
  const day2 = getDayString(date2);
  return day1 === day2;
}

/**
 * Extrai todos os dias únicos de uma lista de logs
 */
export function extractUniqueDays(logs: Array<{ createdAt: Date | string }>): string[] {
  const daysMap = new Map<string, Date>();
  
  logs.forEach((log) => {
    const date = typeof log.createdAt === "string" ? new Date(log.createdAt) : log.createdAt;
    const normalized = normalizeDateForDay(date);
    const dayString = normalized.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    
    // Mantém a data mais recente para cada dia
    if (!daysMap.has(dayString) || daysMap.get(dayString)! < normalized) {
      daysMap.set(dayString, normalized);
    }
  });
  
  // Ordena os dias do mais recente para o mais antigo usando as datas reais
  return Array.from(daysMap.entries())
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .map(([dayString]) => dayString);
}

/**
 * Filtra logs por dia
 */
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
