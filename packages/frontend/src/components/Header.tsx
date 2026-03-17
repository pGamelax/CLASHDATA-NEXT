"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { authClient, useOrganizations, useSession } from "@/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Settings,
  LayoutDashboard,
  Shield,
  Swords,
  Users,
  Trophy,
  Zap,
  TrendingUp,
  CalendarClock,
  CreditCard,
  Menu,
  Bell,
  Check,
  X,
  Building2,
  User,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { OrganizationSelector } from "./OrganizationSelector";
import { getClansByOrganization, type Invite } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { usePendingInvites, type PendingInvitesState } from "@/hooks/usePendingInvites";

// ---- Types ----

interface HeaderProps {
  user?: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
    role?: string | null;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    subscription?: { plan?: string; status?: string } | null;
  };
  clan?: {
    id: string;
    name: string;
    clanTag: string;
    metadata?: any;
  };
  clans?: any[];
}

// ---- Nav config ----

const orgNavItems = [
  { title: "Overview", href: "", icon: LayoutDashboard },
  { title: "Clans", href: "/clans", icon: Shield },
  { title: "Membros", href: "/members", icon: Users },
  { title: "Billing", href: "/subscription", icon: CreditCard },
  { title: "Settings", href: "/settings", icon: Settings },
];

const clanNavItems = [
  { title: "Dashboard", href: "", icon: LayoutDashboard },
  { title: "Guerra atual", href: "/current-war", icon: Zap },
  { title: "Ranking random", href: "/random-ranking", icon: Swords },
  { title: "CWL Atual", href: "/current-cwl", icon: Trophy },
  { title: "Ranking CWL", href: "/cwl-ranking", icon: Trophy },
  { title: "Player Push", href: "/player-push", icon: TrendingUp },
  { title: "Fim de Temporada", href: "/season-end", icon: CalendarClock },
];

const mainNavItems = [
  { title: "Planos", href: "/pricing", icon: CreditCard },
  { title: "Jogador", href: "/player/search", icon: User },
];

// ---- Sub-components (receive data via props — no extra fetches) ----

interface InviteBadgeProps {
  count: number;
}

function InviteBadge({ count }: InviteBadgeProps) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold pointer-events-none ring-2 ring-background">
      {count > 9 ? "9+" : count}
    </span>
  );
}

interface InviteItemProps {
  invite: Invite;
  compact?: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

function InviteItem({ invite, compact, onAccept, onReject }: InviteItemProps) {
  const orgName = invite.organization?.name || "Organização";

  if (compact) {
    return (
      <DropdownMenuItem
        className="flex flex-col items-start p-3 cursor-default focus:bg-transparent"
        onSelect={(e) => e.preventDefault()}
      >
        <div className="flex items-start gap-2 w-full mb-2">
          <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium truncate flex-1">{orgName}</p>
        </div>
        <div className="flex gap-1.5 w-full">
          <Button
            size="sm"
            variant="default"
            className="flex-1 h-7 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); onAccept(invite.id); }}
          >
            <Check className="h-3 w-3" />
            Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); onReject(invite.id); }}
          >
            <X className="h-3 w-3" />
            Rejeitar
          </Button>
        </div>
      </DropdownMenuItem>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/40">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{orgName}</p>
          <p className="text-xs text-muted-foreground">Você foi convidado</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="default" className="flex-1 h-8 text-xs gap-1.5" onClick={() => onAccept(invite.id)}>
          <Check className="h-3.5 w-3.5" />
          Aceitar
        </Button>
        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={() => onReject(invite.id)}>
          <X className="h-3.5 w-3.5" />
          Rejeitar
        </Button>
      </div>
    </div>
  );
}

// Dropdown variant (inside DropdownMenu)
interface DropdownInviteSectionProps extends PendingInvitesState {}

function DropdownInviteSection({ pendingInvites, message, handleAccept, handleReject }: DropdownInviteSectionProps) {
  if (pendingInvites.length === 0) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider px-3 py-1.5">
        <Bell className="h-3.5 w-3.5" />
        Convites ({pendingInvites.length})
      </DropdownMenuLabel>
      {message && (
        <div className={cn(
          "mx-2 mb-1 px-2 py-1.5 rounded-md text-xs font-medium",
          message.type === "success"
            ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : "bg-destructive/10 text-destructive"
        )}>
          {message.text}
        </div>
      )}
      {pendingInvites.map((invite) => (
        <InviteItem
          key={invite.id}
          invite={invite}
          compact
          onAccept={handleAccept}
          onReject={handleReject}
        />
      ))}
    </>
  );
}

// Sheet variant (inside mobile drawer)
interface SheetInviteSectionProps extends PendingInvitesState {}

function SheetInviteSection({ pendingInvites, message, handleAccept, handleReject }: SheetInviteSectionProps) {
  if (pendingInvites.length === 0) return null;

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Bell className="h-3.5 w-3.5" />
        Convites ({pendingInvites.length})
      </div>
      {message && (
        <div className={cn(
          "px-2 py-1.5 rounded-md text-xs font-medium",
          message.type === "success"
            ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : "bg-destructive/10 text-destructive"
        )}>
          {message.text}
        </div>
      )}
      <div className="space-y-2">
        {pendingInvites.map((invite) => (
          <InviteItem
            key={invite.id}
            invite={invite}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Main Header ----

export function Header({
  user: initialUser,
  organization,
  clan,
  clans = [],
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: isSessionPending } = useSession();
  const { data: organizations, isPending: isLoadingOrgs, refetch } = useOrganizations();

  // ✅ Single instance — no duplicate fetches
  const pendingInvitesState = usePendingInvites();

  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clansFromUrl, setClansFromUrl] = useState<any[]>([]);
  const [detectedOrg, setDetectedOrg] = useState<any>(null);
  const [detectedClan, setDetectedClan] = useState<any>(null);

  // Ref to prevent duplicate clan fetches for the same org
  const clansFetchedForOrgRef = useRef<string | null>(null);

  const user = !isSessionPending && session?.user ? session.user : initialUser ?? null;

  const orgsList = useMemo(() => {
    try {
      const data = (organizations as any)?.data || organizations || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [organizations]);

  const orgsListIds = useMemo(
    () => orgsList.map((org: any) => org?.id).filter(Boolean).join(","),
    [orgsList]
  );

  // Refs to diff prev values without causing re-renders
  const prevOrgsListIdsRef = useRef("");
  const prevOrgIdRef = useRef<string | null>(null);
  const prevUserEmailRef = useRef<string | null>(null);

  // Sync selectedOrganization
  useEffect(() => {
    const currentOrgId = organization?.id ?? null;
    const currentUserEmail = user?.email ?? null;
    const changed =
      prevOrgsListIdsRef.current !== orgsListIds ||
      prevOrgIdRef.current !== currentOrgId ||
      prevUserEmailRef.current !== currentUserEmail;

    if (!changed) return;

    prevOrgsListIdsRef.current = orgsListIds;
    prevOrgIdRef.current = currentOrgId;
    prevUserEmailRef.current = currentUserEmail;

    if (!user) {
      setSelectedOrganization((prev) => {
        if (prev !== null) localStorage.removeItem("selectedOrganization");
        return null;
      });
      return;
    }

    if (organization) {
      setSelectedOrganization((prev) => (prev !== organization.id ? organization.id : prev));
      return;
    }

    if (orgsList.length > 0) {
      const saved = localStorage.getItem("selectedOrganization");
      if (saved && orgsList.some((org: any) => org.id === saved)) {
        setSelectedOrganization((prev) => (prev !== saved ? saved : prev));
      } else {
        const first = orgsList[0];
        if (first) {
          setSelectedOrganization((prev) => {
            if (prev !== first.id) {
              localStorage.setItem("selectedOrganization", first.id);
              return first.id;
            }
            return prev;
          });
        }
      }
    } else {
      setSelectedOrganization((prev) => {
        if (prev !== null) localStorage.removeItem("selectedOrganization");
        return null;
      });
    }
  }, [orgsListIds, organization?.id, user?.email, orgsList]);

  // Handle org created event
  useEffect(() => {
    if (!user) return;

    const handler = async (event: Event) => {
      const { organizationId } = (event as CustomEvent<{ organizationId: string }>).detail ?? {};
      if (!organizationId) return;
      try {
        await refetch();
        let attempts = 0;
        const checkAndSet = () => {
          attempts++;
          if (localStorage.getItem("selectedOrganization") === organizationId || attempts >= 5) {
            setSelectedOrganization(organizationId);
            localStorage.setItem("selectedOrganization", organizationId);
          } else {
            setTimeout(checkAndSet, 200);
          }
        };
        setTimeout(checkAndSet, 300);
      } catch { /* noop */ }
    };

    window.addEventListener("organizationCreated", handler);
    return () => window.removeEventListener("organizationCreated", handler);
  }, [refetch, user]);

  const handleOrganizationChange = useCallback((orgId: string) => {
    if (!user) return;
    setSelectedOrganization(orgId);
    localStorage.setItem("selectedOrganization", orgId);
    document.cookie = `selectedOrganization=${orgId}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("organizationChanged", { detail: { organizationId: orgId } }));
  }, [user]);

  const orgsForSelector = useMemo(() =>
    user && Array.isArray(orgsList)
      ? orgsList.flatMap((org: any) => {
          try {
            return [{
              id: org.id,
              name: org.name,
              slug: org.slug,
              logo: org.logo ?? null,
              subscription: org.subscription
                ? { plan: org.subscription.plan, status: org.subscription.status }
                : null,
            }];
          } catch {
            return [];
          }
        })
      : [],
    [user, orgsList]
  );

  const currentOrgId = organization?.id || selectedOrganization;
  const currentOrgFromList = useMemo(
    () => currentOrgId ? orgsForSelector.find((o) => o.id === currentOrgId) ?? null : null,
    [currentOrgId, orgsForSelector]
  );

  // ✅ Consolidated clan detection — single effect, single fetch per org
  useEffect(() => {
    if (!user) {
      setDetectedOrg(null);
      setDetectedClan(null);
      setClansFromUrl([]);
      clansFetchedForOrgRef.current = null;
      return;
    }

    // Props take priority
    if (organization && clan) {
      setDetectedOrg(organization);
      setDetectedClan(clan);
      if (clans.length === 0 && organization.id && clansFetchedForOrgRef.current !== organization.id) {
        clansFetchedForOrgRef.current = organization.id;
        getClansByOrganization(organization.id)
          .then((res) => {
            const data = res?.data || res || [];
            setClansFromUrl(Array.isArray(data) ? data : []);
          })
          .catch(() => {});
      }
      return;
    }

    // Detect from URL
    const pathParts = pathname?.split("/").filter(Boolean) || [];
    const isOrgRoute = pathParts[0] === "org" && pathParts[1] && pathParts[1] !== "new";

    if (!isOrgRoute || orgsList.length === 0) {
      setDetectedOrg(null);
      setDetectedClan(null);
      setClansFromUrl([]);
      clansFetchedForOrgRef.current = null;
      return;
    }

    const orgSlug = pathParts[1];
    const clanSlug = pathParts[2] ?? null;
    const orgFromUrl = orgsList.find((o: any) => o.slug === orgSlug);

    if (!orgFromUrl) {
      setDetectedOrg(null);
      setDetectedClan(null);
      setClansFromUrl([]);
      clansFetchedForOrgRef.current = null;
      return;
    }

    setDetectedOrg(orgFromUrl);

    // Only fetch if we haven't already fetched for this org
    if (clansFetchedForOrgRef.current !== orgFromUrl.id) {
      clansFetchedForOrgRef.current = orgFromUrl.id;
      getClansByOrganization(orgFromUrl.id)
        .then((res) => {
          const data = res?.data || res || [];
          const clansArr = Array.isArray(data) ? data : [];
          setClansFromUrl(clansArr);

          if (clanSlug) {
            const found = clansArr.find(
              (c: any) => c.clanTag.replace("#", "").toLowerCase() === clanSlug.toLowerCase()
            );
            setDetectedClan(found || null);
          } else {
            setDetectedClan(null);
          }
        })
        .catch(() => {
          clansFetchedForOrgRef.current = null; // Allow retry on error
        });
    } else {
      // Already have clans, just update detected clan
      if (clanSlug) {
        const found = clansFromUrl.find(
          (c: any) => c.clanTag.replace("#", "").toLowerCase() === clanSlug.toLowerCase()
        );
        setDetectedClan(found || null);
      } else {
        setDetectedClan(null);
      }
    }
  }, [pathname, orgsList.length, organization?.id, clan?.id, user?.email, clans.length]);

  const currentOrg = user
    ? currentOrgFromList ||
      detectedOrg ||
      (organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo ?? null,
            subscription: organization.subscription
              ? { plan: organization.subscription.plan ?? "", status: organization.subscription.status ?? "" }
              : null,
          }
        : null)
    : null;

  const currentClan = user ? clan || detectedClan || null : null;
  const currentClans = user ? (clans.length > 0 ? clans : clansFromUrl) : [];

  const basePath =
    user && currentClan?.clanTag && currentOrg?.slug
      ? `/org/${currentOrg.slug}/${currentClan.clanTag.replace("#", "").toLowerCase()}`
      : user && currentOrg?.slug
        ? `/org/${currentOrg.slug}`
        : "";

  const isClanRoute = !!currentClan;
  const navItems = user ? (isClanRoute ? clanNavItems : orgNavItems) : [];

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      window.location.href = "/";
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const orgSelectorProps = {
    organizations: orgsForSelector,
    currentOrganization: currentOrg,
    currentClan: currentClan || null,
    clans: currentClans,
    organizationSlug: currentOrg?.slug,
    onSelect: handleOrganizationChange,
    onClanSelect: (clanSlug: string) => {
      if (currentOrg) router.push(`/org/${currentOrg.slug}/${clanSlug}`);
    },
    isLoading: isLoadingOrgs,
    user,
    showFullName: true,
  };

  const showSubNav =
    user &&
    pathname?.startsWith("/org/") &&
    !pathname.startsWith("/org/new") &&
    navItems.length > 0 &&
    (currentOrg || currentClan);

  return (
    <>
      {/* ── Main Header Bar ── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4 gap-2">

          {/* Left: Logo + Selectors + Nav */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group shrink-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                  <path d="M4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M8 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 10C4 10 2 10 2 7C2 4 5 4 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 10C20 10 22 10 22 7C22 4 19 4 19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="hidden sm:block text-base font-bold tracking-tight">
                CLASH<span className="text-primary">DATA</span>
              </span>
            </Link>

            {user && (
              <>
                <div className="h-5 w-px bg-border/70 shrink-0" />

                {/* Org selector — visible on all breakpoints */}
                <div className="min-w-0 flex-1 max-w-50 sm:max-w-xs">
                  <OrganizationSelector {...orgSelectorProps} />
                </div>

                {/* Desktop: main nav links */}
                <div className="hidden md:flex items-center gap-1 ml-1">
                  <div className="h-5 w-px bg-border/70 mr-1" />
                  {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right: Mobile menu + Avatar */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Mobile hamburger */}
            {user && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 flex flex-col p-0">
                  <SheetHeader className="px-4 pt-5 pb-3 border-b">
                    <SheetTitle className="flex items-center gap-2 text-base">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
                          <path d="M4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M8 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M16 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M4 10C4 10 2 10 2 7C2 4 5 4 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M20 10C20 10 22 10 22 7C22 4 19 4 19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      CLASH<span className="text-primary">DATA</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                    {mainNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname?.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>

                  <SheetFooter className="flex-col gap-3 px-3 pb-4 pt-3 border-t">
                    {/* Pending invites */}
                    <SheetInviteSection
                      {...pendingInvitesState}
                      handleAccept={async (id) => {
                        await pendingInvitesState.handleAccept(id);
                        setMobileMenuOpen(false);
                      }}
                    />

                    {/* User info */}
                    <div className="flex items-center gap-3 px-1 py-1">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-0.5">
                      {"role" in user && user.role === "admin" && (
                        <button
                          onClick={() => { router.push("/admin"); setMobileMenuOpen(false); }}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          <Settings className="h-4 w-4" />
                          Admin Panel
                        </button>
                      )}
                      <button
                        onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            )}

            {/* Avatar / auth buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hidden md:flex relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/30 focus-visible:ring-primary focus-visible:outline-none transition-all"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || ""} alt={user.name || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* ✅ Uses data already fetched by the single usePendingInvites call */}
                    <InviteBadge count={pendingInvitesState.pendingInvites.length} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-60 z-200" sideOffset={8}>
                  {/* User info */}
                  <div className="flex items-center gap-3 px-3 py-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user.image || ""} alt={user.name || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* ✅ Receives data from the parent — no extra fetch */}
                  <DropdownInviteSection {...pendingInvitesState} />

                  <DropdownMenuSeparator />

                  {"role" in user && user.role === "admin" && (
                    <>
                      <DropdownMenuItem onClick={() => router.push("/admin")} className="gap-2">
                        <Settings className="h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-up">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Sub-nav tab bar (org/clan routes) ── */}
      {showSubNav && (
        <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex h-11 items-center gap-0.5 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const Icon = item.icon;
                const href = basePath ? `${basePath}${item.href}` : item.href;
                const isActive = item.href === "" ? pathname === basePath : pathname.startsWith(href);
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap rounded-md shrink-0 border-b-2",
                      isActive
                        ? "text-foreground border-primary"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
