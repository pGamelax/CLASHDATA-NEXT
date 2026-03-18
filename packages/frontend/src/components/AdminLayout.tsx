"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Building2,
  CreditCard,
  Users,
  CalendarClock,
  PackageOpen,
  Megaphone,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { title: "Dashboard",     href: "/admin",                icon: LayoutDashboard },
  { title: "Clans",         href: "/admin/clans",          icon: Shield },
  { title: "Organizações",  href: "/admin/organizations",  icon: Building2 },
  { title: "Assinaturas",   href: "/admin/subscriptions",  icon: CreditCard },
  { title: "Usuários",      href: "/admin/users",          icon: Users },
  { title: "Planos",        href: "/admin/plans",          icon: PackageOpen },
  { title: "Temporadas",    href: "/admin/season-dates",   icon: CalendarClock },
  { title: "Anúncios",      href: "/admin/announcements",  icon: Megaphone },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Fetch alert count (expiring subs + orgs without sub)
  useEffect(() => {
    fetch(`${apiUrl}/admin/stats`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.stats) return;
        const expiring = data.stats.subscriptions?.expiringSoon?.length ?? 0;
        const noSub = data.stats.organizations?.withoutSubscription > 0 ? 1 : 0;
        setAlertCount(expiring + noSub);
      })
      .catch(() => {});
  }, [apiUrl]);

  return (
    <>
      {/* Sub-nav */}
      <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto">
          <div className="flex h-12 items-center gap-0.5 overflow-x-auto px-2 sm:px-4 scrollbar-hide">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              const isDashboard = item.href === "/admin";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap rounded-md shrink-0 border-b-2",
                    isActive
                      ? "text-foreground border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/60"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.title}</span>
                  {/* Alert badge on Dashboard tab */}
                  {isDashboard && alertCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black leading-none">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </div>
    </>
  );
}
