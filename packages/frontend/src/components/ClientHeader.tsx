"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import { useSession } from "@/auth";

interface ClientHeaderProps {
  initialUser?: {
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
  };
  clan?: {
    id: string;
    name: string;
    clanTag: string;
    metadata?: any;
  };
  clans?: any[];
}

export function ClientHeader({ initialUser, organization, clan, clans }: ClientHeaderProps) {
  const { data: session, isPending } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted 
    ? (isPending 
        ? initialUser 
        : (session?.user || (session === null ? undefined : initialUser)))
    : initialUser;

  const safeUser = user ?? undefined;
  const safeOrganization = safeUser ? organization : undefined;
  const safeClan = safeUser ? clan : undefined;
  const safeClans = safeUser ? clans : [];

  return <Header user={safeUser} organization={safeOrganization} clan={safeClan} clans={safeClans} />;
}

