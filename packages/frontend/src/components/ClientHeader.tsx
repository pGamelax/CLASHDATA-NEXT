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
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // Garante que o componente está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Usa o usuário da sessão se disponível, senão usa o initialUser
  const user = mounted ? (session?.user || initialUser) : initialUser;

  return <Header user={user} organization={organization} clan={clan} clans={clans} />;
}

