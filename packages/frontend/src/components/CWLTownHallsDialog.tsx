"use client";

import { useState, useEffect, useMemo } from "react";
import { getClansTownHalls, type ClanTownHalls } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

interface CWLTownHallsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clanTag: string;
}

export function CWLTownHallsDialog({
  open,
  onOpenChange,
  clanTag,
}: CWLTownHallsDialogProps) {
  const [data, setData] = useState<ClanTownHalls[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open && clanTag) {
      setIsLoading(true);
      setError(null);
      getClansTownHalls(clanTag)
        .then(setData)
        .catch((err) => {
          setError(err.message || "Erro ao carregar dados");
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, clanTag]);

  const getTownHallImage = (level: number) => {
    if (level >= 3 && level <= 18) {
      return `/townhall/th${level}_min.png`;
    }
    return null;
  };

  const toggleRow = (clanTag: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clanTag)) {
        newSet.delete(clanTag);
      } else {
        newSet.add(clanTag);
      }
      return newSet;
    });
  };

  const getTownHallsList = (townHalls: Record<string, number>) => {
    return Object.entries(townHalls)
      .map(([key, count]) => {
        const level = parseInt(key.replace("th", ""));
        return { level, count };
      })
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.level - a.level); // Maior para menor
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "overflow-hidden flex flex-col p-0",
          isMobile 
            ? "w-full h-[90vh]" 
            : "w-[95vw] max-w-[95vw] h-full"
        )}
      >
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <SheetTitle className="text-base sm:text-xl">CVs Cadastrados na CWL</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12 px-4 sm:px-6">{error}</div>
        ) : (
          <div className="overflow-auto flex-1 px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
              {data.map((item) => {
                const isCurrentClan =
                  item.clan.tag ===
                  (clanTag.startsWith("#") ? clanTag : `#${clanTag}`);
                const isExpanded = expandedRows.has(item.clan.tag);
                const townHallsList = getTownHallsList(item.townHalls);
                const totalMembers = townHallsList.reduce((sum, { count }) => sum + count, 0);

                return (
                  <div
                    key={item.clan.tag}
                    className={cn(
                      "border rounded-lg transition-colors",
                      isCurrentClan && "bg-primary/10 border-primary/30",
                      !isCurrentClan && "bg-muted/30 border-border hover:bg-muted/50"
                    )}
                  >
                    <div
                      className="flex items-center gap-2 sm:gap-3 lg:gap-4 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 cursor-pointer"
                      onClick={() => toggleRow(item.clan.tag)}
                    >
                      <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground" />
                        )}
                      </div>
                      <img
                        src={item.clan.badgeUrls.small}
                        alt={item.clan.name}
                        className="w-5 h-5 sm:w-7 sm:h-7 lg:w-10 lg:h-10 shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-xs sm:text-sm lg:text-lg truncate leading-tight">
                          {item.clan.name}
                        </span>
                        <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate leading-tight">
                          {item.clan.tag}
                        </span>
                      </div>
                      {item.clan.clanLevel && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs lg:text-sm shrink-0 px-1.5 sm:px-2 lg:px-2.5 py-0 h-4 sm:h-5 lg:h-6">
                          {item.clan.clanLevel}
                        </Badge>
                      )}
                      <span className="text-xs sm:text-sm lg:text-base text-muted-foreground shrink-0 font-medium">
                        {totalMembers} CVs
                      </span>
                    </div>

                    {isExpanded && townHallsList.length > 0 && (
                      <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-5 pt-0 border-t bg-muted/20">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 lg:gap-4 pt-3 lg:pt-4">
                          {townHallsList.map(({ level, count }) => (
                            <div
                              key={level}
                              className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 p-2 sm:p-2.5 lg:p-3 rounded-lg bg-background border hover:border-primary/30 transition-colors"
                            >
                              {getTownHallImage(level) && (
                                <Image
                                  src={getTownHallImage(level)!}
                                  alt={`TH${level}`}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 sm:w-7 sm:h-7 lg:w-10 lg:h-10 object-contain shrink-0"
                                  unoptimized
                                />
                              )}
                              <span className="font-semibold text-xs sm:text-sm lg:text-base leading-tight whitespace-nowrap">
                                CV{level} - {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
