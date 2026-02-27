"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Building2,
  CreditCard,
  Users,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Clans", href: "/admin/clans", icon: Shield },
  { title: "Organizações", href: "/admin/organizations", icon: Building2 },
  { title: "Assinaturas", href: "/admin/subscriptions", icon: CreditCard },
  { title: "Usuários", href: "/admin/users", icon: Users },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Secondary Navigation Bar */}
      <div className="sticky top-16 px-4 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/90 shadow-sm">
        <div className="flex h-12 items-center gap-1 overflow-x-auto px-2 sm:px-4 scrollbar-hide">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap border-b-2 border-transparent shrink-0",
                  isActive
                    ? "text-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </div>
    </>
  );
}
