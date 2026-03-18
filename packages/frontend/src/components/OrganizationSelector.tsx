"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  Loader2,
  LayoutGrid,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getClansByOrganization } from "@/lib/api";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  subscription?: { status?: string; plan?: string } | null;
}

interface Clan {
  id: string;
  name: string;
  clanTag: string;
  badgeUrls?: { small?: string; medium?: string; large?: string } | null;
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
  user?: { name?: string | null; email?: string | null } | null;
  showFullName?: boolean;
}

export function OrganizationSelector({
  organizations,
  currentOrganization,
  currentClan,
  clans = [],
  onSelect,
  isLoading = false,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [orgClansCache, setOrgClansCache] = useState<Record<string, Clan[]>>({});
  const [loadingOrgId, setLoadingOrgId] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Seed cache with current org's clans
  useEffect(() => {
    if (currentOrganization?.id && clans.length > 0) {
      setOrgClansCache((prev) => ({ ...prev, [currentOrganization.id]: clans }));
    }
  }, [currentOrganization?.id, clans]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setExpandedOrgId(currentOrganization?.id ?? null);
    setOpen(isOpen);
  };

  const handleToggleExpand = useCallback(
    async (e: React.MouseEvent, orgId: string) => {
      e.stopPropagation();
      if (expandedOrgId === orgId) {
        setExpandedOrgId(null);
        return;
      }
      setExpandedOrgId(orgId);
      if (orgClansCache[orgId] !== undefined) return;

      setLoadingOrgId(orgId);
      try {
        const res = await getClansByOrganization(orgId);
        const data = res?.data ?? res ?? [];
        setOrgClansCache((prev) => ({
          ...prev,
          [orgId]: Array.isArray(data) ? data : [],
        }));
      } catch {
        setOrgClansCache((prev) => ({ ...prev, [orgId]: [] }));
      } finally {
        setLoadingOrgId(null);
      }
    },
    [expandedOrgId, orgClansCache]
  );

  const handleOrgNavigate = (org: Organization) => {
    onSelect(org.id);
    setOpen(false);
    router.push(`/org/${org.slug}`);
  };

  const handleClanNavigate = (clan: Clan, orgId: string, orgSlug: string) => {
    if (orgId !== currentOrganization?.id) onSelect(orgId);
    setOpen(false);
    const clanPath = clan.clanTag.replace("#", "").toLowerCase();
    router.push(`/org/${orgSlug}/${clanPath}`);
  };

  const displayName = currentClan
    ? currentClan.name
    : currentOrganization?.name ?? "Organização";

  const displayIcon = currentClan?.badgeUrls?.small ? (
    <img src={currentClan.badgeUrls.small} alt={currentClan.name} className="w-full h-full object-contain" />
  ) : currentOrganization?.logo ? (
    <img src={currentOrganization.logo} alt={currentOrganization.name} className="w-full h-full rounded-md object-cover" />
  ) : (
    <Building2 className="h-3.5 w-3.5 text-primary" />
  );

  const trigger = (
    <button
      onClick={() => handleOpenChange(true)}
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg",
        "bg-muted/80 hover:bg-muted transition-colors",
        "text-sm font-medium max-w-[180px] sm:max-w-[220px]",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
      disabled={isLoading}
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 shrink-0">
        {displayIcon}
      </div>
      <span className="truncate text-foreground flex-1 min-w-0 text-left text-xs sm:text-sm">
        {displayName}
      </span>
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </button>
  );

  const content = (
    <div className="flex flex-col h-full">
      {/* Org list */}
      <div className="flex-1 overflow-y-auto py-1">
        {organizations.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma organização encontrada
          </div>
        ) : (
          organizations.map((org) => {
            const isCurrentOrg = currentOrganization?.id === org.id;
            const isExpanded = expandedOrgId === org.id;
            const cachedClans = orgClansCache[org.id] ?? [];
            const isLoadingClans = loadingOrgId === org.id;

            return (
              <div key={org.id}>
                {/* Org row */}
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-2 mx-1.5 rounded-xl transition-colors",
                    isCurrentOrg ? "bg-primary/8" : "hover:bg-accent/60"
                  )}
                >
                  {/* Expand chevron — large tap area on mobile */}
                  <button
                    onClick={(e) => handleToggleExpand(e, org.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    aria-label={isExpanded ? "Recolher clãs" : "Expandir clãs"}
                  >
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-150",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>

                  {/* Org logo */}
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                    {org.logo ? (
                      <img src={org.logo} alt={org.name} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Building2 className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Org name — click navigates */}
                  <button
                    onClick={() => handleOrgNavigate(org)}
                    className="flex-1 min-w-0 text-left py-1 group"
                  >
                    <span
                      className={cn(
                        "block truncate text-sm font-semibold transition-colors leading-tight",
                        isCurrentOrg
                          ? "text-foreground"
                          : "text-foreground/80 group-hover:text-foreground"
                      )}
                    >
                      {org.name}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate mt-0.5">
                      @{org.slug}
                    </span>
                  </button>

                  {isCurrentOrg && !currentClan && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>

                {/* Expanded clans */}
                {isExpanded && (
                  <div className="ml-12 mr-2 mb-1.5 mt-0.5 border-l-2 border-border/50 pl-2.5 space-y-0.5">
                    {isLoadingClans ? (
                      <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Carregando clãs...
                      </div>
                    ) : cachedClans.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-muted-foreground">
                        Nenhum clã nesta organização
                      </div>
                    ) : (
                      cachedClans.map((clan) => {
                        const isCurrentClan = currentClan?.id === clan.id && isCurrentOrg;
                        return (
                          <button
                            key={clan.id}
                            onClick={() => handleClanNavigate(clan, org.id, org.slug)}
                            className={cn(
                              "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-colors",
                              isCurrentClan
                                ? "bg-primary/8 text-foreground"
                                : "text-foreground/80 hover:bg-accent/60 hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                              {clan.badgeUrls?.small ? (
                                <img src={clan.badgeUrls.small} alt={clan.name} className="w-full h-full object-contain" />
                              ) : (
                                <Building2 className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block truncate text-sm font-medium leading-tight">
                                {clan.name}
                              </span>
                              <span className="block text-xs text-muted-foreground mt-0.5">
                                {clan.clanTag}
                              </span>
                            </div>
                            {isCurrentClan && (
                              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-2 shrink-0">
        <button
          onClick={() => { setOpen(false); router.push("/pricing"); }}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Organização
        </button>
      </div>
    </div>
  );

  // Mobile: bottom Sheet
  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="p-0 rounded-t-2xl max-h-[80vh] flex flex-col"
          >
            <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Organizações
                </SheetTitle>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setOpen(false); router.push("/organizations"); }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Ver todas
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </SheetHeader>
            {content}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: dropdown
  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-80 p-0 bg-background border shadow-xl rounded-xl overflow-hidden max-h-[70vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-3 py-2.5 border-b flex items-center justify-between bg-muted/30 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Organizações
          </span>
          <button
            onClick={() => { setOpen(false); router.push("/organizations"); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <LayoutGrid className="h-3 w-3" />
            Ver todas
          </button>
        </div>
        {content}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
