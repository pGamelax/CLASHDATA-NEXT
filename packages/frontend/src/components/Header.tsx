"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  BarChart3,
  Users,
  Trophy,
  Zap,
  TrendingUp,
  CreditCard,
  Menu,
  Bell,
  Check,
  X,
  Building2,
  User,
  Home,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { OrganizationSelector } from "./OrganizationSelector";
import {
  getPendingInvites,
  acceptInvite,
  rejectInvite,
  getClansByOrganization,
  type Invite,
} from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    subscription?: {
      plan?: string;
      status?: string;
    } | null;
  };
  clan?: {
    id: string;
    name: string;
    clanTag: string;
    metadata?: any;
  };
  clans?: any[];
}

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
];

const mainNavItems = [
  { title: "Planos", href: "/pricing", icon: CreditCard },
  { title: "Jogador", href: "/player/search", icon: User },
];

function InviteBadge() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvites = async () => {
      try {
        const data = await getPendingInvites();
        const count = data.filter((i: Invite) => i.status === "PENDING").length;
        setPendingCount(count);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadInvites();
    const interval = setInterval(loadInvites, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || pendingCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold pointer-events-none ring-2 ring-background">
      {pendingCount > 9 ? "9+" : pendingCount}
    </span>
  );
}

function PendingInvitesDropdownSeparator() {
  const [hasInvites, setHasInvites] = useState(false);

  useEffect(() => {
    const checkInvites = async () => {
      try {
        const data = await getPendingInvites();
        const count = data.filter((i: Invite) => i.status === "PENDING").length;
        setHasInvites(count > 0);
      } catch (error) {
        setHasInvites(false);
      }
    };

    checkInvites();
    const interval = setInterval(checkInvites, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!hasInvites) return null;
  return <DropdownMenuSeparator />;
}

function PendingInvitesDropdown() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const data = await getPendingInvites();
      setInvites(data);
    } catch (error) {
      console.error("Erro ao carregar convites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    try {
      await acceptInvite(inviteId);
      setMessage({ type: "success", text: "Convite aceito com sucesso!" });
      await loadInvites();
      const invite = invites.find((i) => i.id === inviteId);
      if (invite?.organization?.slug) {
        window.dispatchEvent(new CustomEvent("organizationChanged"));
        setTimeout(() => {
          router.push(`/org/${invite?.organization?.slug}`);
          router.refresh();
        }, 500);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao aceitar convite",
      });
    }
  };

  const handleReject = async (inviteId: string) => {
    try {
      await rejectInvite(inviteId);
      setMessage({ type: "success", text: "Convite rejeitado" });
      await loadInvites();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao rejeitar convite",
      });
    }
  };

  const pendingCount = invites.filter((i) => i.status === "PENDING").length;
  const pendingInvites = invites.filter((i) => i.status === "PENDING");

  if (loading) {
    return (
      <>
        <DropdownMenuLabel>Convites Pendentes</DropdownMenuLabel>
        <div className="p-4 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      </>
    );
  }

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <>
      {message && (
        <div className="px-2 py-1">
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-2"
          >
            <AlertDescription className="text-xs">
              {message.text}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <DropdownMenuLabel className="flex items-center gap-2">
        <Bell className="h-4 w-4" />
        Convites Pendentes ({pendingCount})
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {Array.isArray(pendingInvites) && pendingInvites.map((invite) => (
        <DropdownMenuItem
          key={invite?.id || Math.random()}
          className="flex flex-col items-start p-3 cursor-default"
          onSelect={(e) => e.preventDefault()}
        >
          <div className="flex items-start gap-2 w-full mb-2">
            <Building2 className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {invite.organization?.name || "Organização"}
              </p>
              <p className="text-xs text-muted-foreground">
                Convite de {invite.organization?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-1 w-full">
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleAccept(invite.id);
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleReject(invite.id);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Rejeitar
            </Button>
          </div>
        </DropdownMenuItem>
      ))}
    </>
  );
}

function PendingInvitesSheetFooter() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const data = await getPendingInvites();
      setInvites(data);
    } catch (error) {
      console.error("Erro ao carregar convites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    try {
      await acceptInvite(inviteId);
      setMessage({ type: "success", text: "Convite aceito com sucesso!" });
      await loadInvites();
      const invite = invites.find((i) => i.id === inviteId);
      if (invite?.organization?.slug) {
        window.dispatchEvent(new CustomEvent("organizationChanged"));
        setTimeout(() => {
          router.push(`/org/${invite?.organization?.slug}`);
          router.refresh();
        }, 500);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao aceitar convite",
      });
    }
  };

  const handleReject = async (inviteId: string) => {
    try {
      await rejectInvite(inviteId);
      setMessage({ type: "success", text: "Convite rejeitado" });
      await loadInvites();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao rejeitar convite",
      });
    }
  };

  const pendingInvites = invites.filter((i) => i.status === "PENDING");

  if (loading) {
    return (
      <div className="px-3 py-2 text-center text-sm text-muted-foreground">
        Carregando convites...
      </div>
    );
  }

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-2">
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className="mb-2"
        >
          <AlertDescription className="text-xs">
            {message.text}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Bell className="h-4 w-4" />
        Convites Pendentes ({pendingInvites.length})
      </div>
      <div className="space-y-2">
        {Array.isArray(pendingInvites) && pendingInvites.map((invite) => (
          <div
            key={invite?.id || Math.random()}
            className="flex flex-col gap-2 p-3 rounded-md border bg-muted/50"
          >
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {invite.organization?.name || "Organização"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Convite de {invite.organization?.name}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1 h-8 text-xs"
                onClick={() => handleAccept(invite.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={() => handleReject(invite.id)}
              >
                <X className="h-3 w-3 mr-1" />
                Rejeitar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Header({
  user: initialUser,
  organization,
  clan,
  clans = [],
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: isSessionPending } = useSession();
  const {
    data: organizations,
    isPending: isLoadingOrgs,
    refetch,
  } = useOrganizations();
  const [selectedOrganization, setSelectedOrganization] = useState<
    string | null
  >(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clansFromUrl, setClansFromUrl] = useState<any[]>([]);
  const [detectedOrg, setDetectedOrg] = useState<any>(null);
  const [detectedClan, setDetectedClan] = useState<any>(null);

  const user = (!isSessionPending && session?.user) ? session.user : (initialUser || null);
  
  const orgsList = useMemo(() => {
    try {
      const organizationsData = organizations?.data || organizations || [];
      return Array.isArray(organizationsData) ? organizationsData : [];
    } catch (error) {
      console.error("Erro ao processar organizações:", error);
      return [];
    }
  }, [organizations]);

  const orgsListIds = useMemo(() => orgsList.map((org: any) => org?.id).filter(Boolean).join(","), [orgsList]);
  const prevOrgsListIdsRef = useRef<string>("");
  const prevOrgIdRef = useRef<string | null>(null);
  const prevUserEmailRef = useRef<string | null>(null);

  useEffect(() => {
    const currentOrgId = organization?.id || null;
    const currentUserEmail = user?.email || null;
    const orgsListChanged = prevOrgsListIdsRef.current !== orgsListIds;
    const orgChanged = prevOrgIdRef.current !== currentOrgId;
    const userChanged = prevUserEmailRef.current !== currentUserEmail;

    if (!orgsListChanged && !orgChanged && !userChanged) {
      return;
    }

    prevOrgsListIdsRef.current = orgsListIds;
    prevOrgIdRef.current = currentOrgId;
    prevUserEmailRef.current = currentUserEmail;

    if (!user) {
      setSelectedOrganization((prev) => {
        if (prev !== null) {
          localStorage.removeItem("selectedOrganization");
          return null;
        }
        return prev;
      });
      return;
    }

    if (organization) {
      const currentId = organization.id;
      setSelectedOrganization((prev) => {
        if (prev !== currentId) {
          return currentId;
        }
        return prev;
      });
      return;
    }

    if (orgsList.length > 0) {
      const saved = localStorage.getItem("selectedOrganization");
      if (saved && orgsList.some((org: any) => org.id === saved)) {
        setSelectedOrganization((prev) => {
          if (prev !== saved) {
            return saved;
          }
          return prev;
        });
      } else {
        const firstOrg = orgsList[0];
        if (firstOrg) {
          setSelectedOrganization((prev) => {
            if (prev !== firstOrg.id) {
              localStorage.setItem("selectedOrganization", firstOrg.id);
              return firstOrg.id;
            }
            return prev;
          });
        }
      }
    } else if (orgsList.length === 0) {
      setSelectedOrganization((prev) => {
        if (prev !== null) {
          localStorage.removeItem("selectedOrganization");
          return null;
        }
        return prev;
      });
    }
  }, [orgsListIds, organization?.id, user?.email, orgsList]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleOrganizationCreated = async (event: Event) => {
      const customEvent = event as CustomEvent<{ organizationId: string }>;
      const { organizationId } = customEvent.detail;
      if (organizationId) {
        try {
          await refetch();
          let attempts = 0;
          const maxAttempts = 5;

          const checkAndSet = () => {
            attempts++;
            const saved = localStorage.getItem("selectedOrganization");
            if (saved === organizationId) {
              setSelectedOrganization(organizationId);
            }

            if (attempts >= maxAttempts) {
              setSelectedOrganization(organizationId);
              localStorage.setItem("selectedOrganization", organizationId);
            } else {
              setTimeout(checkAndSet, 200);
            }
          };

          setTimeout(checkAndSet, 300);
        } catch (error) {
          console.error("Erro ao processar organização criada:", error);
        }
      }
    };

    window.addEventListener("organizationCreated", handleOrganizationCreated);
    return () => {
      window.removeEventListener(
        "organizationCreated",
        handleOrganizationCreated,
      );
    };
  }, [refetch, user]);

  const handleOrganizationChange = async (orgId: string) => {
    if (!user) {
      return;
    }

    try {
      setSelectedOrganization(orgId);
      localStorage.setItem("selectedOrganization", orgId);
      document.cookie = `selectedOrganization=${orgId}; path=/; max-age=31536000; SameSite=Lax`;

      const selectedOrg = Array.isArray(orgsList)
        ? orgsList.find((org: any) => org.id === orgId)
        : null;

      if (selectedOrg) {
        router.push(`/org/${selectedOrg.slug}`);
      }

      window.dispatchEvent(
        new CustomEvent("organizationChanged", {
          detail: { organizationId: orgId },
        }),
      );
      router.refresh();
    } catch (error) {
      console.error("Erro ao mudar organização:", error);
    }
  };

  const orgsForSelector: Array<{
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    subscription: { plan: string; status: string } | null;
  }> = user && Array.isArray(orgsList)
    ? orgsList
        .map((org: any) => {
          try {
            return {
              id: org.id,
              name: org.name,
              slug: org.slug,
              logo: org.logo,
              subscription: org.subscription
                ? {
                    plan: org.subscription.plan,
                    status: org.subscription.status,
                  }
                : null,
            };
          } catch (error) {
            console.error("Erro ao processar organização:", error);
            return null;
          }
        })
        .filter((org): org is {
          id: string;
          name: string;
          slug: string;
          logo: string | null;
          subscription: { plan: string; status: string } | null;
        } => org !== null)
    : [];

  const currentOrgId = organization?.id || selectedOrganization;
  const currentOrgFromList = currentOrgId
    ? orgsForSelector.find((o: any) => o.id === currentOrgId)
    : null;

  useEffect(() => {
    if (!user) {
      setDetectedOrg(null);
      setDetectedClan(null);
      setClansFromUrl([]);
      return;
    }

    if (organization && clan) {
      setDetectedOrg(organization);
      setDetectedClan(clan);
      if (organization.id && !clans.length) {
        getClansByOrganization(organization.id)
          .then((response) => {
            const clansData = response?.data || response || [];
            setClansFromUrl(Array.isArray(clansData) ? clansData : []);
          })
          .catch(() => {});
      }
      return;
    }

    const pathParts = pathname?.split("/").filter(Boolean) || [];
    const isOrgRoute = pathParts[0] === "org" && pathParts[1] && pathParts[1] !== "new";
    const orgSlugFromUrl = isOrgRoute ? pathParts[1] : null;
    const clanSlugFromUrl = isOrgRoute && pathParts[2] ? pathParts[2] : null;

    if (orgSlugFromUrl && orgsList.length > 0) {
      const orgFromUrl = orgsList.find((o: any) => o.slug === orgSlugFromUrl);
      if (orgFromUrl) {
        setDetectedOrg(orgFromUrl);
        
        if (orgFromUrl.id) {
          getClansByOrganization(orgFromUrl.id)
            .then((response) => {
              const clansData = response?.data || response || [];
              setClansFromUrl(Array.isArray(clansData) ? clansData : []);
              
              if (clanSlugFromUrl) {
                const clanFromUrl = clansData.find(
                  (c: any) => c.clanTag.replace("#", "").toLowerCase() === clanSlugFromUrl.toLowerCase()
                );
                setDetectedClan(clanFromUrl || null);
              } else {
                setDetectedClan(null);
              }
            })
            .catch(() => {});
        } else {
          setClansFromUrl([]);
          setDetectedClan(null);
        }
      } else {
        setDetectedOrg(null);
        setDetectedClan(null);
        setClansFromUrl([]);
      }
    } else {
      setDetectedOrg(null);
      setDetectedClan(null);
      setClansFromUrl([]);
    }
  }, [pathname, orgsList, organization, clan, user, clans.length]);

  const currentOrg = user
    ? (currentOrgFromList ||
      detectedOrg ||
      (organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo,
            subscription: organization.subscription
              ? {
                  plan: organization.subscription.plan,
                  status: organization.subscription.status,
                }
              : null,
          }
        : null))
    : null;

  const currentClan = user ? (clan || detectedClan || null) : null;
  const currentClans = user ? (clans.length > 0 ? clans : clansFromUrl) : [];

  useEffect(() => {
    if (!user || !currentOrg?.id) {
      return;
    }

    if (clans.length === 0 && currentClans.length === 0) {
      getClansByOrganization(currentOrg.id)
        .then((response) => {
          const clansData = response?.data || response || [];
          setClansFromUrl(Array.isArray(clansData) ? clansData : []);
        })
        .catch(() => {});
    }
  }, [currentOrg?.id, user, clans.length, currentClans.length]);

  const basePath = user && currentClan && currentOrg && currentOrg.slug && currentClan.clanTag
    ? `/org/${currentOrg.slug}/${currentClan.clanTag.replace("#", "").toLowerCase()}`
    : user && currentOrg && currentOrg.slug
      ? `/org/${currentOrg.slug}`
      : "";

  const isClanRoute = user ? !!currentClan : false;
  const navItems = user && isClanRoute ? clanNavItems : (user ? orgNavItems : []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = "/";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-2 sm:px-4 gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 flex-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 group transition-transform hover:scale-105 shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-sm group-hover:shadow-md transition-shadow">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary"
                >
                  <path
                    d="M4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 17V13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 17V11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 17V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 10C4 10 2 10 2 7C2 4 5 4 5 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 10C20 10 22 10 22 7C22 4 19 4 19 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="hidden sm:inline-flex text-lg font-bold tracking-tight">
                CLASH<span className="text-primary">DATA</span>
              </span>
            </Link>

            {user && (
              <>
                <div className="hidden md:block h-6 w-px bg-border shrink-0" />
                <nav className="hidden md:flex items-center gap-1">
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <OrganizationSelector
                      organizations={orgsForSelector}
                      currentOrganization={
                        currentOrg
                          ? {
                              id: currentOrg.id,
                              name: currentOrg.name,
                              slug: currentOrg.slug,
                              logo: currentOrg.logo,
                              subscription: currentOrg.subscription
                                ? {
                                    plan: currentOrg.subscription.plan,
                                    status: currentOrg.subscription.status,
                                  }
                                : null,
                            }
                          : null
                      }
                      currentClan={currentClan || null}
                      clans={currentClans}
                      organizationSlug={currentOrg?.slug}
                      onSelect={handleOrganizationChange}
                      onClanSelect={(clanSlug) => {
                        if (currentOrg) {
                          router.push(`/org/${currentOrg.slug}/${clanSlug}`);
                        }
                      }}
                      isLoading={isLoadingOrgs}
                      user={user}
                      showFullName={true}
                    />
                  </div>
                </nav>
                <div className="h-6 w-px bg-border shrink-0 hidden sm:block" />
                <nav className="hidden md:flex items-center gap-1">
                  {Array.isArray(mainNavItems) && mainNavItems.map((item) => {
                    if (!item || !item.href || !item.icon) return null;
                    const Icon = item.icon;
                    const isActive = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 flex flex-col">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4 flex-1 overflow-y-auto">
                    {mainNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname?.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                    {user && (
                      <>
                        <div className="h-px bg-border my-4" />
                        <div className="px-3">
                          <OrganizationSelector
                            organizations={orgsForSelector}
                            currentOrganization={
                              currentOrg
                                ? {
                                    id: currentOrg.id,
                                    name: currentOrg.name,
                                    slug: currentOrg.slug,
                                    logo: currentOrg.logo,
                                    subscription: currentOrg.subscription
                                      ? {
                                          plan: currentOrg.subscription.plan,
                                          status: currentOrg.subscription.status,
                                        }
                                      : null,
                                  }
                                : null
                            }
                            currentClan={currentClan || null}
                            clans={currentClans}
                            organizationSlug={currentOrg?.slug}
                            onSelect={(orgId) => {
                              handleOrganizationChange(orgId);
                              setMobileMenuOpen(false);
                            }}
                            onClanSelect={(clanSlug) => {
                              if (currentOrg) {
                                router.push(`/org/${currentOrg.slug}/${clanSlug}`);
                                setMobileMenuOpen(false);
                              }
                            }}
                            isLoading={isLoadingOrgs}
                            user={user}
                            showFullName={true}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <SheetFooter className="flex-col gap-2 border-t pt-4 mt-4">
                    {user && (
                      <>
                        <div className="flex items-center gap-3 w-full px-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || ""} alt={user.name || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate font-mono">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="w-full space-y-1">
                          <PendingInvitesSheetFooter />
                          {user && "role" in user && user.role === "admin" && (
                            <button
                              onClick={() => {
                                router.push("/admin");
                                setMobileMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                              <Settings className="h-5 w-5" />
                              <span>Admin Panel</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleSignOut();
                              setMobileMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-destructive hover:bg-destructive/10"
                          >
                            <LogOut className="h-5 w-5" />
                            <span>Sair</span>
                          </button>
                        </div>
                      </>
                    )}
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hidden md:flex relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || ""} alt={user.name || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <InviteBadge />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 z-[100]">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <PendingInvitesDropdown />
                  <PendingInvitesDropdownSeparator />
                  {user && "role" in user && user.role === "admin" && (
                    <>
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
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

      {user && pathname?.startsWith("/org/") && !pathname?.startsWith("/org/new") && (currentOrg || currentClan) && navItems.length > 0 && (
        <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto">
            <div className="flex h-12 items-center gap-1 overflow-x-auto px-2 sm:px-4 scrollbar-hide">
              {Array.isArray(navItems) && navItems.map((item) => {
                if (!item || !item.href || !item.icon) return null;
                
                const Icon = item.icon;
                const href = basePath ? `${basePath}${item.href}` : item.href;
                const isActive =
                  item.href === ""
                    ? pathname === basePath
                    : pathname.startsWith(href);

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 border-transparent shrink-0",
                      isActive
                        ? "text-foreground border-primary"
                        : "text-muted-foreground hover:text-foreground hover:border-primary/20"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
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
