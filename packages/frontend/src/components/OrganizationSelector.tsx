"use client";

import { useState, useMemo, useEffect } from "react";
import { Building2, ChevronDown, Plus, Search, Check, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getClansByOrganization } from "@/lib/api";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  subscription?: {
    status?: string;
    plan?: string;
  } | null;
}

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

interface OrganizationSelectorProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  currentClan?: Clan | null;
  clans?: Clan[];
  organizationSlug?: string;
  onSelect: (orgId: string) => void;
  onClanSelect?: (clanSlug: string) => void;
  isLoading?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  showFullName?: boolean;
}

export function OrganizationSelector({
  organizations,
  currentOrganization,
  currentClan,
  clans = [],
  organizationSlug,
  onSelect,
  onClanSelect,
  isLoading = false,
  user,
  showFullName = false,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(currentOrganization?.id || null);
  const [selectedOrgClans, setSelectedOrgClans] = useState<Clan[]>([]);
  const [loadingClans, setLoadingClans] = useState(false);

  useEffect(() => {
    if (selectedOrgId && selectedOrgId === currentOrganization?.id) {
      setSelectedOrgClans(clans);
    } else if (selectedOrgId) {
      setLoadingClans(true);
      getClansByOrganization(selectedOrgId)
        .then((response) => {
          const clansData = response?.data || response || [];
          setSelectedOrgClans(Array.isArray(clansData) ? clansData : []);
        })
        .catch(() => {
          setSelectedOrgClans([]);
        })
        .finally(() => {
          setLoadingClans(false);
        });
    } else {
      setSelectedOrgClans([]);
    }
  }, [selectedOrgId, currentOrganization?.id, clans]);

  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const query = searchQuery.toLowerCase();
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.slug.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  const filteredClans = useMemo(() => {
    const clansToFilter = selectedOrgId === currentOrganization?.id ? clans : selectedOrgClans;
    if (!selectedOrgId && !currentOrganization) return [];
    if (!searchQuery.trim()) return clansToFilter;
    const query = searchQuery.toLowerCase();
    return clansToFilter.filter(
      (clan) =>
        clan.name.toLowerCase().includes(query) ||
        clan.clanTag.toLowerCase().includes(query)
    );
  }, [selectedOrgClans, clans, searchQuery, selectedOrgId, currentOrganization]);

  const displayOrg = currentOrganization;
  const displayName = currentClan ? currentClan.name : (currentOrganization?.name || "Selecione uma organização");
  const displayIcon = currentClan?.badgeUrls?.small ? (
    <img
      src={currentClan.badgeUrls.small}
      alt={currentClan.name}
      className="w-full h-full object-contain"
    />
  ) : displayOrg?.logo ? (
    <img
      src={displayOrg.logo}
      alt={displayOrg.name}
      className="w-full h-full rounded-md object-cover"
    />
  ) : (
    <Building2 className="h-3.5 w-3.5 text-primary" />
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md bg-muted/80 hover:bg-muted transition-colors text-xs sm:text-sm font-medium",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            !showFullName && "max-w-[140px] sm:max-w-none"
          )}
          disabled={isLoading}
        >
          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-primary/10 shrink-0">
            {displayIcon}
          </div>
          {showFullName && (
            <span className="truncate text-foreground hidden sm:inline">
              {displayName}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-[95vw] md:w-[600px] max-w-[600px] z-50 p-0 bg-background border shadow-lg">
        <div className="p-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procure uma organização ou clã"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background border-border"
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row max-h-[70vh] md:max-h-[450px]">
          <div className="w-full md:w-1/2 md:border-r border-b md:border-b-0 border-border overflow-y-auto bg-muted/20">
            <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background border-b border-border z-10">
              Organizações
            </div>
            {filteredOrgs.length > 0 ? (
              <div className="py-1">
                {filteredOrgs.map((org) => {
                  const isSelected = (selectedOrgId && selectedOrgId === org.id) || (!selectedOrgId && currentOrganization?.id === org.id && !currentClan);
                  return (
                    <div
                      key={org.id}
                      onClick={() => {
                        if (isSelected) {
                          onSelect(org.id);
                          setOpen(false);
                          router.push(`/org/${org.slug}`);
                        } else {
                          setSelectedOrgId(org.id);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-primary/10 border-l-2 border-l-primary hover:bg-primary/15" 
                          : "hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 shrink-0 border border-primary/20">
                        {org.logo ? (
                          <img
                            src={org.logo}
                            alt={org.name}
                            className="w-full h-full rounded-md object-cover"
                          />
                        ) : (
                          <Building2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "truncate font-medium",
                          isSelected ? "text-foreground" : "text-foreground/90"
                        )}>
                          {org.name}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhuma organização encontrada
              </div>
            )}
          </div>
          <div className="w-full md:w-1/2 overflow-y-auto bg-background">
            {(selectedOrgId || currentOrganization) && (
              <>
                <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background border-b border-border z-10">
                  Clãs
                </div>
                {loadingClans ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : filteredClans.length > 0 ? (
                  <div className="py-1">
                    {filteredClans.map((clan) => {
                      const isSelected = currentClan?.id === clan.id;
                      const orgSlug = selectedOrgId 
                        ? organizations.find(o => o.id === selectedOrgId)?.slug 
                        : organizationSlug;
                      return (
                        <div
                          key={clan.id}
                          onClick={() => {
                            if (selectedOrgId && selectedOrgId !== currentOrganization?.id) {
                              onSelect(selectedOrgId);
                              setTimeout(() => {
                                if (onClanSelect && orgSlug) {
                                  router.push(`/org/${orgSlug}/${clan.clanTag.replace("#", "").toLowerCase()}`);
                                }
                              }, 300);
                              setOpen(false);
                            } else if (onClanSelect && orgSlug) {
                              onClanSelect(clan.clanTag.replace("#", "").toLowerCase());
                              setOpen(false);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                            isSelected 
                              ? "bg-primary/10 border-l-2 border-l-primary" 
                              : "hover:bg-accent/50"
                          )}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 shrink-0 border border-primary/20">
                            {clan.badgeUrls?.small ? (
                              <img
                                src={clan.badgeUrls.small}
                                alt={clan.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "truncate font-medium",
                              isSelected ? "text-foreground" : "text-foreground/90"
                            )}>
                              {clan.name}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {selectedOrgId ? "Nenhum clã encontrado" : "Selecione uma organização para ver os clãs"}
                  </div>
                )}
              </>
            )}
            {!selectedOrgId && !currentOrganization && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Selecione uma organização para ver os clãs
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-border p-3 bg-muted/30">
          <div
            onClick={() => {
              setOpen(false);
              router.push("/pricing");
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-accent rounded-md transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Organização</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
