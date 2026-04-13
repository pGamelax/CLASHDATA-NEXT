"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// All page titles mapped by path segment or pattern
const clanSubPageTitles: Record<string, string> = {
  "":               "Dashboard",
  "current-war":    "Guerra atual",
  "random-ranking": "Ranking random",
  "current-cwl":    "CWL Atual",
  "cwl-ranking":    "Ranking CWL",
  "player-push":    "Player Push",
  "season-end":     "Fim de Temporada",
  "subscription":   "Billing",
};

const staticTitles: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: (p) => p === "/admin",                      title: "Dashboard" },
  { match: (p) => p.startsWith("/admin/clans"),         title: "Clans" },
  { match: (p) => p.startsWith("/admin/users"),         title: "Usuários" },
  { match: (p) => p.startsWith("/admin/plans"),         title: "Planos" },
  { match: (p) => p.startsWith("/admin/season-dates"),  title: "Temporadas" },
  { match: (p) => p.startsWith("/admin/announcements"), title: "Anúncios" },
  { match: (p) => p.startsWith("/admin/faturamento"),   title: "Faturamento" },
  { match: (p) => p === "/clans",                      title: "Clans" },
  { match: (p) => p.startsWith("/ranking"),             title: "Ranking" },
  { match: (p) => p.startsWith("/pricing"),             title: "Planos" },
  { match: (p) => p.startsWith("/player"),              title: "Jogador" },
  { match: (p) => p.startsWith("/user/settings"),       title: "Configurações" },
];

function getPageTitle(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "clan" && parts[1]) {
    const sub = parts.slice(2).join("/") || "";
    return clanSubPageTitles[sub] ?? "";
  }
  for (const entry of staticTitles) {
    if (entry.match(pathname)) return entry.title;
  }
  return "";
}

export function TopBarInfo() {
  const pathname = usePathname() ?? "";
  const pageTitle = getPageTitle(pathname);
  const { toggleSidebar } = useSidebar();

  return (
    <>
      {/* Mobile: CLASHDATA on the left, natural flow */}
      <Link
        href="/"
        className="md:hidden text-sm font-bold tracking-tight select-none"
      >
        CLASH<span className="text-primary">DATA</span>
      </Link>

      {/* Desktop: CLASHDATA centered (absolute) */}
      <Link
        href="/"
        className="hidden md:block absolute left-1/2 -translate-x-1/2 text-sm font-bold tracking-tight select-none"
      >
        CLASH<span className="text-primary">DATA</span>
      </Link>

      {/* Right: page title + hamburger (mobile only) */}
      <div className="ml-auto flex items-center gap-3">
        {pageTitle && (
          <span className="text-sm font-medium text-muted-foreground">
            {pageTitle}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 md:hidden"
          onClick={toggleSidebar}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
}
