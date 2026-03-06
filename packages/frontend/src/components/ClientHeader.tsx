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
  // Se a sessão estiver pendente, usa initialUser para evitar flash de conteúdo
  // Se não houver usuário na sessão após carregar, usa undefined (não null) para garantir logout
  // Durante SSR, sempre usa initialUser para evitar problemas de hidratação
  const user = mounted 
    ? (isPending 
        ? initialUser 
        : (session?.user || (session === null ? undefined : initialUser)))
    : initialUser;

  // Garante que organization e clan só sejam passados se houver usuário
  // Isso evita problemas de hidratação quando o usuário faz logout
  // Converte null para undefined para compatibilidade com tipos do Header
  const safeUser = user ?? undefined;
  const safeOrganization = safeUser ? organization : undefined;
  const safeClan = safeUser ? clan : undefined;
  const safeClans = safeUser ? clans : [];

  return <Header user={safeUser} organization={safeOrganization} clan={safeClan} clans={safeClans} />;
}

