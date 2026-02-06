"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Swords, Shield, LayoutDashboard, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ClanLayoutProps {
  organization: any;
  clan: any;
  clans: any[];
  children: React.ReactNode;
}

const clanNavItems = [
  {
    title: "Dashboard",
    href: "",
    icon: LayoutDashboard,
  },
  {
    title: "Current War",
    href: "/current-war",
    icon: Zap,
  },
  {
    title: "Wars",
    href: "/wars",
    icon: Swords,
  },
];

export function ClanLayout({
  organization,
  clan,
  clans,
  children,
}: ClanLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedClanSlug, setSelectedClanSlug] = useState<string>("");

  useEffect(() => {
    const slug = clan.clanTag.replace("#", "").toLowerCase();
    setSelectedClanSlug(slug);
    localStorage.setItem("selectedClan", slug);
  }, [clan]);

  const handleClanChange = (clanSlug: string) => {
    setSelectedClanSlug(clanSlug);
    localStorage.setItem("selectedClan", clanSlug);
    // Extrai o slug da organização do pathname
    const orgSlug = pathname.split("/")[2];
    router.push(`/org/${orgSlug}/${clanSlug}/wars`);
  };

  // Determina a rota base do clan
  const orgBasePath = `/org/${organization.slug}`;
  const clanBasePath = `${orgBasePath}/${selectedClanSlug}`;
  const currentPath = pathname.replace(clanBasePath, "") || "";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {children}
    </div>
  );
}

