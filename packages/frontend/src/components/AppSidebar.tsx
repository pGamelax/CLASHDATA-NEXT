"use client";

import { useMemo, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient, useClans, useSession } from "@/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Zap,
  Swords,
  Trophy,
  TrendingUp,
  CalendarClock,
  CreditCard,
  Shield,
  ChevronUp,
  Plus,
  Check,
  LogOut,
  Settings,
  ChevronsUpDown,
  User,
  Users,
  PackageOpen,
  Megaphone,
  DollarSign,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface Clan {
  id: string;
  name: string;
  tag: string;
  badgeUrls?: { small?: string; medium?: string; large?: string } | null;
  subscription?: { plan?: string; status?: string } | null;
}

interface AppSidebarProps {
  initialUser?: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

// ── Nav config ───────────────────────────────────────────────────────────────

const clanNavItems = [
  { title: "Dashboard", href: "", icon: LayoutDashboard },
  { title: "Guerra atual", href: "/current-war", icon: Zap },
  { title: "Ranking random", href: "/random-ranking", icon: Swords },
  { title: "CWL Atual", href: "/current-cwl", icon: Trophy },
  { title: "Ranking CWL", href: "/cwl-ranking", icon: Trophy },
  { title: "Player Push", href: "/player-push", icon: TrendingUp },
  { title: "Fim de Temporada", href: "/season-end", icon: CalendarClock },
  { title: "Billing", href: "/subscription", icon: CreditCard },
];

const adminNavItems = [
  { title: "Dashboard",   href: "/admin",                 icon: LayoutDashboard },
  { title: "Clans",       href: "/admin/clans",           icon: Shield },
  { title: "Usuários",    href: "/admin/users",           icon: Users },
  { title: "Planos",      href: "/admin/plans",           icon: PackageOpen },
  { title: "Temporadas",  href: "/admin/season-dates",    icon: CalendarClock },
  { title: "Anúncios",    href: "/admin/announcements",   icon: Megaphone },
  { title: "Faturamento", href: "/admin/faturamento",     icon: DollarSign },
  { title: "Indicações",  href: "/admin/referrals",       icon: Gift },
];

const mainNavItems = [
  { title: "Clans", href: "/clans", icon: Shield },
  { title: "Ranking", href: "/ranking", icon: Trophy },
  { title: "Planos", href: "/pricing", icon: CreditCard },
  { title: "Jogador", href: "/player/search", icon: User },
  { title: "Indicação", href: "/user/settings?tab=referral", icon: Gift },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTag(tag: string) {
  return tag.replace("#", "").toLowerCase();
}

function getDefaultAvatar(name: string) {
  const seed = encodeURIComponent(name || "user");
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,ffdfbf,d1d4f9,ffd5dc,c0e6c0`;
}

// ── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-sidebar-accent transition-colors group/logo group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/20 group-hover/logo:bg-primary/15 transition-colors shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
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
      <span className="text-sm font-bold tracking-tight group-data-[collapsible=icon]:hidden">
        CLASH<span className="text-primary">DATA</span>
      </span>
    </Link>
  );
}

// ── Clan Selector ─────────────────────────────────────────────────────────────

interface ClanSelectorSidebarProps {
  clans: Clan[];
  currentClan: Clan | null;
  isLoading: boolean;
  onSelect: (clan: Clan) => void;
}

function ClanSelectorSidebar({
  clans,
  currentClan,
  isLoading,
  onSelect,
}: ClanSelectorSidebarProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2 rounded-md px-2 h-12 text-sm outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
          >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                {currentClan?.badgeUrls?.small ? (
                  <img
                    src={currentClan.badgeUrls.small}
                    alt={currentClan.name}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <Shield className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold truncate leading-tight">
                  {currentClan?.name ??
                    (clans.length > 0 ? clans[0].name : "Selecionar Clan")}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {currentClan?.tag ??
                    (clans.length > 0 ? clans[0].tag : "Nenhum clan")}
                </span>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl p-1"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {clans.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Nenhum clan cadastrado
              </div>
            ) : (
              clans.map((clan) => {
                const isActive = currentClan?.id === clan.id;
                return (
                  <DropdownMenuItem
                    key={clan.id}
                    onClick={() => onSelect(clan)}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      {clan.badgeUrls?.small ? (
                        <img
                          src={clan.badgeUrls.small}
                          alt={clan.name}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate leading-tight">
                        {clan.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {clan.tag}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/pricing"
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Adicionar clan</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────

export function AppSidebar({ initialUser }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const { data: clansData, isPending: isLoadingClans } = useClans();

  const user =
    !isSessionPending && session?.user ? session.user : (initialUser ?? null);

  const clansList = useMemo<Clan[]>(() => {
    try {
      const data =
        (clansData as any)?.data ||
        (clansData as any)?.clans ||
        clansData ||
        [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [clansData]);

  // Extract clan tag + sub-page from current pathname
  const { currentClanTag, subPage } = useMemo(() => {
    const parts = pathname?.split("/").filter(Boolean) || [];
    if (parts[0] === "clan" && parts[1]) {
      return {
        currentClanTag: parts[1],
        subPage: parts.slice(2).join("/"),
      };
    }
    return { currentClanTag: null, subPage: "" };
  }, [pathname]);

  const currentClan = useMemo(() => {
    if (!currentClanTag) return clansList[0] ?? null;
    return (
      clansList.find(
        (c) => normalizeTag(c.tag) === normalizeTag(currentClanTag),
      ) ?? null
    );
  }, [currentClanTag, clansList]);

  // Active base path for nav items
  const activeClan = currentClan ?? clansList[0] ?? null;
  const basePath = activeClan ? `/clan/${normalizeTag(activeClan.tag)}` : "";

  const handleClanSelect = (clan: Clan) => {
    const slug = normalizeTag(clan.tag);
    if (subPage) {
      router.push(`/clan/${slug}/${subPage}`);
    } else if (currentClanTag) {
      router.push(`/clan/${slug}`);
    } else {
      router.push(`/clan/${slug}`);
    }
  };

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

  const isAdmin = user && "role" in user && (user as any).role === "admin";
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  // Close sidebar on mobile whenever the route changes
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  return (
    <Sidebar side={isMobile ? "right" : "left"} collapsible="icon">
      {/* ── Header: Logo ── */}
      <SidebarHeader className="py-3 px-2">
        <Logo />
      </SidebarHeader>

      <SidebarContent>
        {/* ── Clan Selector ── */}
        <SidebarGroup className="px-2 pt-0 pb-2">
          <SidebarGroupContent>
            <ClanSelectorSidebar
              clans={clansList}
              currentClan={currentClan}
              isLoading={isLoadingClans}
              onSelect={handleClanSelect}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ── Main Nav ── */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const basHref = item.href.split("?")[0];
                const isActive = pathname?.startsWith(basHref) && basHref !== "/";
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        
        {/* ── Clan Nav (only when clans exist) ── */}
        {clansList.length > 0 && basePath && (
          <SidebarGroup className="px-2">
            <SidebarGroupLabel>Clan</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clanNavItems.map((item) => {
                  const Icon = item.icon;
                  const href = `${basePath}${item.href}`;
                  const isActive =
                    item.href === ""
                      ? pathname === basePath || pathname === `${basePath}/`
                      : pathname.startsWith(href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={href}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ── Admin Nav ── */}
        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup className="px-2">
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* ── Footer: User ── */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex w-full items-center gap-2 rounded-md px-2 h-12 text-sm outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={user?.image || getDefaultAvatar(user?.name || "")}
                      alt={user?.name || ""}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold truncate leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                side="top"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage
                      src={user?.image || getDefaultAvatar(user?.name || "")}
                      alt={user?.name || ""}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate">
                      {user?.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/user/settings")}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
