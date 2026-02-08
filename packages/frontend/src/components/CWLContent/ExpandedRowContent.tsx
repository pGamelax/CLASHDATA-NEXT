"use client";

import { Star, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CWLPlayerStats } from "@/lib/api";

interface ExpandedRowContentProps {
  player: CWLPlayerStats;
}

export function ExpandedRowContent({ player }: ExpandedRowContentProps) {
  // Ordena ataques por temporada (mais recente primeiro)
  const sortedAttacks = [...player.attacks].sort((a, b) => {
    // Compara temporadas no formato "YYYY-MM"
    return b.season.localeCompare(a.season);
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
            // Formata a temporada (ex: "2026-01" -> "Janeiro 2026")
            const [year, month] = attack.season.split("-");
            const monthNumber = parseInt(month, 10);
            const monthName = new Date(2000, monthNumber - 1, 1).toLocaleDateString("pt-BR", {
              month: "long",
            });
            const formattedSeason = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
            
            // Garante que opponentClanName existe
            const opponentClanName = attack.opponentClanName || "Clan Desconhecido";
            const isPerfect = attack.stars === 3 && attack.destructionPercentage === 100;
            
            return (
              <div
                key={`${attack.season}-${attack.defenderTag}-${index}`}
                className="relative bg-card/50 border border-border/50 rounded-lg p-2 sm:p-3 hover:bg-card hover:border-border transition-all"
              >
                {/* Badge de performance no canto superior direito */}
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
                
                {/* Conteúdo do card */}
                <div className="pr-16 sm:pr-20">
                  <div className="font-medium text-xs sm:text-sm mb-1 sm:mb-1.5 line-clamp-1">
                    {opponentClanName}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {formattedSeason}
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

