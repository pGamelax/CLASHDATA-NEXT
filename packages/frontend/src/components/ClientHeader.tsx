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

  // Garante que o componente está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Usa o usuário da sessão se disponível, senão usa o initialUser
  // Se a sessão estiver pendente ou não houver usuário na sessão, usa initialUser
  const user = mounted 
    ? (isPending ? initialUser : (session?.user || initialUser))
    : initialUser;

  return <Header user={user} organization={organization} clan={clan} clans={clans} />;
}

