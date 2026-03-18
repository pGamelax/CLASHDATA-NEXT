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
  { title: "Ranking", href: "/ranking", icon: Trophy },
  { title: "Planos", href: "/pricing", icon: CreditCard },
  { title: "Jogador", href: "/player/search", icon: User },
];

// ---- Sub-components ----

function InviteBadge({ count }: { count: number }) {
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
          <Button size="sm" variant="default" className="flex-1 h-7 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); onAccept(invite.id); }}>
            <Check className="h-3 w-3" /> Aceitar
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); onReject(invite.id); }}>
            <X className="h-3 w-3" /> Rejeitar
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
          <Check className="h-3.5 w-3.5" /> Aceitar
        </Button>
        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={() => onReject(invite.id)}>
          <X className="h-3.5 w-3.5" /> Rejeitar
        </Button>
      </div>
    </div>
  );
}

function DropdownInviteSection({ pendingInvites, message, handleAccept, handleReject }: PendingInvitesState) {
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
        <InviteItem key={invite.id} invite={invite} compact onAccept={handleAccept} onReject={handleReject} />
      ))}
    </>
  );
}

function SheetInviteSection({ pendingInvites, message, handleAccept, handleReject }: PendingInvitesState) {
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
          <InviteItem key={invite.id} invite={invite} onAccept={handleAccept} onReject={handleReject} />
        ))}
      </div>
    </div>
  );
}

function getDefaultAvatar(name: string) {
  const seed = encodeURIComponent(name || "user");
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,ffdfbf,d1d4f9,ffd5dc,c0e6c0`;
}

// ---- Logo ----
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0">
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
  const pendingInvitesState = usePendingInvites();

  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clansFromUrl, setClansFromUrl] = useState<any[]>([]);
  const [detectedOrg, setDetectedOrg] = useState<any>(null);
  const [detectedClan, setDetectedClan] = useState<any>(null);

  const clansFetchedForOrgRef = useRef<string | null>(null);

  const user = !isSessionPending && session?.user ? session.user : initialUser ?? null;

  const orgsList = useMemo(() => {
    try {
      const data = (organizations as any)?.data || organizations || [];
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }, [organizations]);

  const orgsListIds = useMemo(
    () => orgsList.map((org: any) => org?.id).filter(Boolean).join(","),
    [orgsList]
  );

  const prevOrgsListIdsRef = useRef("");
  const prevOrgIdRef = useRef<string | null>(null);
  const prevUserEmailRef = useRef<string | null>(null);

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
          } else { setTimeout(checkAndSet, 200); }
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
          } catch { return []; }
        })
      : [],
    [user, orgsList]
  );

  const currentOrgId = organization?.id || selectedOrganization;
  const currentOrgFromList = useMemo(
    () => currentOrgId ? orgsForSelector.find((o) => o.id === currentOrgId) ?? null : null,
    [currentOrgId, orgsForSelector]
  );

  useEffect(() => {
    if (!user) {
      setDetectedOrg(null);
      setDetectedClan(null);
      setClansFromUrl([]);
      clansFetchedForOrgRef.current = null;
      return;
    }

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
        .catch(() => { clansFetchedForOrgRef.current = null; });
    } else {
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
    ? detectedOrg ||
      currentOrgFromList ||
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
    try { await authClient.signOut(); }
    finally { window.location.href = "/"; }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const firstName = user?.name?.split(" ")[0] || "";

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
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">

          {/* LEFT: Logo + Org Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <Logo />
            {user && (
              <>
                <div className="h-5 w-px bg-border/60 shrink-0" />
                <div className="w-40 sm:w-48">
                  <OrganizationSelector {...orgSelectorProps} />
                </div>
              </>
            )}
          </div>

          {/* CENTER: Nav links */}
          <div className="flex-1 flex items-center justify-center">
            {user ? (
              <nav className="hidden md:flex items-center gap-0.5">
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
                      <Icon className="h-3.5 w-3.5" />
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <nav className="hidden sm:flex items-center gap-0.5">
                <Link
                  href="/ranking"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    pathname?.startsWith("/ranking")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Ranking
                </Link>
              </nav>
            )}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                {/* Mobile hamburger */}
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
                      <SheetInviteSection
                        {...pendingInvitesState}
                        handleAccept={async (id) => {
                          await pendingInvitesState.handleAccept(id);
                          setMobileMenuOpen(false);
                        }}
                      />
                      <div className="flex items-center gap-3 px-1 py-1">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={user.image || getDefaultAvatar(user.name || "")} alt={user.name || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <button
                          onClick={() => { router.push("/user/settings"); setMobileMenuOpen(false); }}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          <Settings className="h-4 w-4" />
                          Configurações
                        </button>
                        {"role" in user && user.role === "admin" && (
                          <button
                            onClick={() => { router.push("/admin"); setMobileMenuOpen(false); }}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Shield className="h-4 w-4" />
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

                {/* Desktop: Username + Avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="hidden md:flex relative items-center gap-2.5 pl-1 pr-2 py-1 rounded-full border border-transparent hover:border-border hover:bg-accent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                          <AvatarImage src={user.image || getDefaultAvatar(user.name || "")} alt={user.name || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <InviteBadge count={pendingInvitesState.pendingInvites.length} />
                      </div>
                      <span className="text-sm font-medium max-w-28 truncate">{firstName}</span>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-60 z-200" sideOffset={8}>
                    {/* User info */}
                    <div className="flex items-center gap-3 px-3 py-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={user.image || getDefaultAvatar(user.name || "")} alt={user.name || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    <DropdownInviteSection {...pendingInvitesState} />

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => router.push("/user/settings")} className="gap-2">
                      <Settings className="h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>

                    {"role" in user && user.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/admin")} className="gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
