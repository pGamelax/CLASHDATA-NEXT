"use client";

import { Star, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PlayerStats } from "@/lib/api";

interface ExpandedRowContentProps {
  player: PlayerStats;
}

export function ExpandedRowContent({ player }: ExpandedRowContentProps) {
  const sortedAttacks = [...player.attacks].sort((a, b) => {
    return new Date(b.warEndTime).getTime() - new Date(a.warEndTime).getTime();
  });

  return (
    <div className="p-3 sm:p-6 bg-muted/10 overflow-y-auto max-h-96">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Swords className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        <h4 className="font-semibold text-xs sm:text-sm text-foreground">
          Ataques Feitos
        </h4>
      </div>
      {sortedAttacks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {sortedAttacks.map((attack, index) => {
            let date: Date;
            const warEndTime = attack.warEndTime;
            
            if (!warEndTime) {
              date = new Date(NaN);
            } else if (typeof warEndTime === 'string') {
             
              const compactFormatMatch = warEndTime.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/);
              
              if (compactFormatMatch) {
               
                const [, year, month, day, hour, minute, second, millisecond] = compactFormatMatch;
                const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}Z`;
                date = new Date(isoString);
              } else if (warEndTime.includes('T') && warEndTime.includes('-')) {
             
                date = new Date(warEndTime);
              } else {
           
                const numValue = Number(warEndTime);
                if (!isNaN(numValue) && isFinite(numValue)) {
                  date = new Date(numValue < 1e12 ? numValue * 1000 : numValue);
                } else {
                  date = new Date(warEndTime);
                }
              }
            } else if (typeof warEndTime === 'number') {
              date = new Date(warEndTime < 1e12 ? warEndTime * 1000 : warEndTime);
            } else {
              date = new Date(warEndTime);
            }

            const isValidDate = !isNaN(date.getTime());
            const year = isValidDate ? date.getFullYear() : 0;
            const isReasonableDate = year >= 2000 && year <= 2100;
            
            const formattedDate = (isValidDate && isReasonableDate)
              ? date.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Data inválida";
            const opponentClanName = attack.opponentClanName || "Clan Desconhecido";
            const isPerfect = attack.stars === 3 && attack.destructionPercentage === 100;
            
            return (
              <div
                key={`${attack.warEndTime}-${attack.defenderTag}-${index}`}
                className="relative bg-card/50 border border-border/50 rounded-lg p-2 sm:p-3 hover:bg-card hover:border-border transition-all"
              >
                {}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 ${
                      isPerfect 
                        ? "bg-primary/20 text-primary border-primary/30" 
                        : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                    }`}
                  >
                    {attack.destructionPercentage.toFixed(0)}% {attack.stars}★
                  </Badge>
                </div>
                
                {}
                <div className="pr-16 sm:pr-20">
                  <div className="font-medium text-xs sm:text-sm mb-1 sm:mb-1.5 line-clamp-1">
                    {opponentClanName}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {formattedDate}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                Nenhum ataque registrado
              </div>
            )}
    </div>
  );
}
