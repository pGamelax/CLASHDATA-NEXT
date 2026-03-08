"use client";

import { useState, useMemo } from "react";
import { Shield, ChevronDown, Search, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Clan {
  id: string;
  name: string;
  clanTag: string;
  badgeUrls?: {
    small?: string;
    medium?: string;
    large?: string;
  } | null;
}

interface ClanSelectorProps {
  clans: Clan[];
  currentClan: Clan | null;
  organizationSlug: string;
  onSelect: (clanSlug: string) => void;
  showFullName?: boolean;
}

export function ClanSelector({
  clans,
  currentClan,
  organizationSlug,
  onSelect,
  showFullName = false,
}: ClanSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getClanSlug = (clan: Clan) => {
    return clan.clanTag.replace("#", "").toLowerCase();
  };

  const filteredClans = useMemo(() => {
    if (!searchQuery.trim()) return clans;
    const query = searchQuery.toLowerCase();
    return clans.filter(
      (clan) =>
        clan.name.toLowerCase().includes(query) ||
        clan.clanTag.toLowerCase().includes(query)
    );
  }, [clans, searchQuery]);

  const handleSelect = (clan: Clan) => {
    const slug = getClanSlug(clan);
    onSelect(slug);
    router.push(`/org/${organizationSlug}/${slug}`);
    setOpen(false);
  };

  const displayClan = currentClan || clans[0];

  if (clans.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md bg-muted/80 hover:bg-muted transition-colors text-sm font-medium",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-md shrink-0">
            {displayClan?.badgeUrls?.small ? (
              <img
                src={displayClan.badgeUrls.small}
                alt={displayClan.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <Shield className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
          <span className="truncate text-foreground font-medium">
            {displayClan?.name || "Selecione um clã"}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-80 z-50">
        <div className="p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procure um clã"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {filteredClans.length > 0 ? (
            filteredClans.map((clan) => {
              const isSelected = currentClan?.id === clan.id;
              return (
                <DropdownMenuItem
                  key={clan.id}
                  onClick={() => handleSelect(clan)}
                  className={cn(
                    "flex items-center gap-2 p-2 cursor-pointer",
                    isSelected && "bg-accent"
                  )}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-md shrink-0">
                    {clan.badgeUrls?.small ? (
                      <img
                        src={clan.badgeUrls.small}
                        alt={clan.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Shield className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="truncate font-medium">{clan.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {clan.clanTag}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Nenhum clã encontrado
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
