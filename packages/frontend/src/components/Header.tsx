"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { OrganizationSelector } from "./OrganizationSelector";
import { ClanSelector } from "./ClanSelector";
import {
  getPendingInvites,
  acceptInvite,
  rejectInvite,
  type Invite,
} from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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

const NavWithoutOrgOrClan = [
  { title: "Organizações", href: "/organizations"},
  { title: "Planos", href: "/pricing"},
];
// Componente para badge de notificação de convites
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
        console.error("Erro ao carregar convites:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInvites();
    // Atualiza a cada 30 segundos
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

// Componente para separador após convites (apenas se houver convites)
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

// Componente para exibir convites dentro do dropdown do avatar
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
    return null; // Não mostra nada se não houver convites
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
      {pendingInvites.map((invite) => (
        <DropdownMenuItem
          key={invite.id}
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

export function Header({
  user: initialUser,
  organization,
  clan,
  clans = [],
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const {
    data: organizations,
    isPending: isLoadingOrgs,
    refetch,
  } = useOrganizations();
  const [selectedOrganization, setSelectedOrganization] = useState<
    string | null
  >(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Usa o usuário da sessão se disponível (sempre atualizado), senão usa o initialUser (SSR)
  // Prioriza session?.user porque é atualizado em tempo real
  const user = session?.user || initialUser;

  // O endpoint /organizations/list retorna { success: true, data: [...] }
  const organizationsData = organizations?.data || organizations || [];
  const orgsList = Array.isArray(organizationsData) ? organizationsData : [];

  useEffect(() => {
    if (organization) {
      setSelectedOrganization(organization.id);
    } else if (Array.isArray(orgsList) && orgsList.length > 0) {
      const saved = localStorage.getItem("selectedOrganization");
      if (saved && orgsList.some((org: any) => org.id === saved)) {
        if (selectedOrganization !== saved) {
          setSelectedOrganization(saved);
        }
      } else {
        const firstOrg = orgsList[0];
        if (selectedOrganization !== firstOrg.id) {
          setSelectedOrganization(firstOrg.id);
          localStorage.setItem("selectedOrganization", firstOrg.id);
        }
      }
    } else if (Array.isArray(orgsList) && orgsList.length === 0) {
      setSelectedOrganization(null);
      localStorage.removeItem("selectedOrganization");
    }
  }, [orgsList, selectedOrganization, organization]);

  // Escuta eventos de criação de organização
  useEffect(() => {
    const handleOrganizationCreated = async (event: Event) => {
      const customEvent = event as CustomEvent<{ organizationId: string }>;
      const { organizationId } = customEvent.detail;
      if (organizationId) {
        // Força um refetch para atualizar a lista
        await refetch();

        // Aguarda um pouco e verifica se a organização está na lista
        // Tenta até 5 vezes (1 segundo total) para garantir que os dados foram atualizados
        let attempts = 0;
        const maxAttempts = 5;

        const checkAndSet = () => {
          attempts++;
          // Busca a lista atualizada do localStorage ou do estado
          // Como o refetch atualiza o estado, vamos verificar após um delay
          const saved = localStorage.getItem("selectedOrganization");
          if (saved === organizationId) {
            // Se o ID está salvo, força a atualização do estado
            setSelectedOrganization(organizationId);
          }

          // Se ainda não encontrou após várias tentativas, define mesmo assim
          if (attempts >= maxAttempts) {
            setSelectedOrganization(organizationId);
            localStorage.setItem("selectedOrganization", organizationId);
          } else {
            setTimeout(checkAndSet, 200);
          }
        };

        setTimeout(checkAndSet, 300);
      }
    };

    window.addEventListener("organizationCreated", handleOrganizationCreated);
    return () => {
      window.removeEventListener(
        "organizationCreated",
        handleOrganizationCreated,
      );
    };
  }, [refetch]);

  // Verifica periodicamente se há uma nova organização no localStorage que não está selecionada
  useEffect(() => {
    const checkForNewOrganization = () => {
      const saved = localStorage.getItem("selectedOrganization");
      if (saved && saved !== selectedOrganization) {
        // Se há uma organização salva diferente da selecionada, verifica se está na lista
        const currentList = organizations?.data || organizations || [];
        if (
          Array.isArray(currentList) &&
          currentList.some((org: any) => org.id === saved)
        ) {
          setSelectedOrganization(saved);
        } else {
          // Se não está na lista, força um refetch
          refetch();
        }
      }
    };

    // Verifica a cada 500ms
    const interval = setInterval(checkForNewOrganization, 500);
    return () => clearInterval(interval);
  }, [selectedOrganization, organizations, refetch]);

  const handleOrganizationChange = async (orgId: string) => {
    setSelectedOrganization(orgId);
    localStorage.setItem("selectedOrganization", orgId);
    // Atualiza o cookie para o servidor poder ler
    document.cookie = `selectedOrganization=${orgId}; path=/; max-age=31536000; SameSite=Lax`;

    // Encontra o slug da organização selecionada
    const selectedOrg = Array.isArray(orgsList)
      ? orgsList.find((org: any) => org.id === orgId)
      : null;

    if (selectedOrg) {
      // Redireciona para a página da organização
      router.push(`/org/${selectedOrg.slug}`);
    }

    // Dispara evento customizado para notificar outros componentes
    window.dispatchEvent(
      new CustomEvent("organizationChanged", {
        detail: { organizationId: orgId },
      }),
    );
    // Força atualização da página para buscar novos dados
    router.refresh();
  };

  // Prepara lista de organizações com subscription para o seletor
  const orgsForSelector = Array.isArray(orgsList)
    ? orgsList.map((org: any) => ({
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
      }))
    : [];

  // Encontra a organização atual com subscription processada
  // Prioriza a organização de orgsList (que tem subscription) se disponível
  const currentOrgId = organization?.id || selectedOrganization;
  const currentOrgFromList = currentOrgId
    ? orgsForSelector.find((o: any) => o.id === currentOrgId)
    : null;

  // Usa a organização de orgsList se disponível (tem subscription), senão usa a organization passada como prop
  const currentOrg =
    currentOrgFromList ||
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
      : null);

  // Determina a rota base
  const basePath = clan
    ? `/org/${organization?.slug}/${clan.clanTag.replace("#", "").toLowerCase()}`
    : organization
      ? `/org/${organization.slug}`
      : "";

  // Verifica se está em uma rota de clan
  const isClanRoute = !!clan;

  // Seleciona os itens de navegação apropriados
  const navItems = isClanRoute ? clanNavItems : orgNavItems;

  const handleSignOut = async () => {
    await authClient.signOut();
    // Força refresh da página para atualizar o estado
    router.push("/");
    router.refresh();
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
      {/* Top Header Bar */}
      <header
        className={`sticky px-2 top-0 z-50 w-full bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/90 border-b border-border/60 shadow-lg ${organization || clan ? "" : "border-b border-border"}`}
      >
        <div className="flex h-16 items-center justify-between px-2 sm:px-4 gap-2">
          {/* Logo, CLASHDATA e Links de Navegação */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-sm min-w-0 flex-1">
            {/* Logo ClashData */}
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 group shrink-0 px-2"
            >
              <div className="p-1.5 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-md group-hover:scale-110 group-hover:shadow-lg group-hover:border-primary/50 transition-all duration-300">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary w-5 h-5 sm:w-7 sm:h-7"
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

              <div className="hidden sm:flex items-center px-2">
                <span className="text-sm sm:text-base font-bold">
                  CLASH<span className="text-primary">DATA</span>
                </span>
              </div>
            </Link>

            {/* Seletor de Organização */}
            {user && (organization || clan) ? (
              <>
                <div className="w-px h-5 sm:h-6 bg-border/50 shrink-0" />
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
                  onSelect={handleOrganizationChange}
                  isLoading={isLoadingOrgs}
                  user={user}
                />
              </>
            ) : (
              <>
                <div className="w-px h-5 sm:h-6 bg-border/50 shrink-0" />
                <div className="flex items-center flex-row gap-2">
                  {NavWithoutOrgOrClan.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium hover:bg-secondary/50 rounded-md transition-colors"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Seletor de Clan */}
            {clan && currentOrg && (
              <>
                <div className="w-px h-5 sm:h-6 bg-border/50 shrink-0" />
                <ClanSelector
                  clans={clans}
                  currentClan={clan}
                  organizationSlug={currentOrg.slug}
                  onSelect={(clanSlug) => {
                    router.push(`/org/${currentOrg.slug}/${clanSlug}`);
                  }}
                />
              </>
            )}
          </div>

          {/* Lado Direito - Autenticação */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Avatar */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex flex-row gap-2 items-center">
                    <p className="hidden sm:block text-sm font-medium truncate">
                      {user.name}
                    </p>
                    <Button
                      variant={"ghost"}
                      className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-transparent ring-offset-1 ring-offset-background transition-all hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                    >
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        <AvatarImage
                          src={user.image || ""}
                          alt={user.name || ""}
                        />
                        <AvatarFallback className="text-[10px] sm:text-xs bg-primary/10 text-primary font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Badge de notificação de convites */}
                      <InviteBadge />
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 sm:w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* Convites Pendentes dentro do dropdown */}
                  <PendingInvitesDropdown />
                  {/* Separador após convites se houver */}
                  <PendingInvitesDropdownSeparator />
                  {user && "role" in user && user.role === "admin" && (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
                  onClick={() => router.push("/sign-in")}
                >
                  Entrar
                </Button>
                <Button
                  size="sm"
                  className="text-[11px] sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
                  onClick={() => router.push("/sign-up")}
                >
                  Cadastrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Secondary Navigation Bar */}
      {(organization || clan) && (
        <div className="sticky top-16 px-4 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/90 shadow-sm">
          <div className="flex h-12 items-center gap-1 overflow-x-auto px-2 sm:px-4 scrollbar-hide">
            {navItems.map((item) => {
              const href = `${basePath}${item.href}`;
              const isActive =
                item.href === ""
                  ? pathname === basePath
                  : pathname.startsWith(href);

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap border-b-2 border-transparent shrink-0",
                    isActive
                      ? "text-foreground border-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
