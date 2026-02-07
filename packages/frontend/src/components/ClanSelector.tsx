"use client";

import { useState } from "react";
import { Shield, ChevronsUpDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}

export function ClanSelector({
  clans,
  currentClan,
  organizationSlug,
  onSelect,
}: ClanSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const getClanSlug = (clan: Clan) => {
    return clan.clanTag.replace("#", "").toLowerCase();
  };

  if (!currentClan || clans.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 sm:gap-2.5 p-1 rounded-md sm:rounded-lg bg-muted/80 hover:bg-muted transition-colors text-xs sm:text-sm font-medium",
            "sm:min-w-[140px] sm:max-w-[200px]",
            "focus:outline-none"
          )}
        >
          {/* Badge do clan */}
          <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md shrink-0">
            {currentClan.badgeUrls?.small ? (
              <img
                src={currentClan.badgeUrls.small}
                alt={currentClan.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            )}
          </div>
          
          {/* Nome do clan - escondido no mobile */}
          <span className="hidden sm:block truncate flex-1 text-left text-foreground">
            {currentClan.name}
          </span>
          
          {/* Ícone de setas */}
          <ChevronsUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-[240px] z-50">
        {clans.map((clan) => {
          const isSelected = currentClan.id === clan.id;
          const slug = getClanSlug(clan);
          return (
            <DropdownMenuItem
              key={clan.id}
              onClick={() => {
                onSelect(slug);
                setOpen(false);
                router.push(`/org/${organizationSlug}/${slug}`);
              }}
              className={cn(
                "flex items-center gap-2 p-1 cursor-pointer",
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
              <span className="flex-1 truncate">
                {clan.name} ({clan.clanTag})
              </span>
              {isSelected && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
