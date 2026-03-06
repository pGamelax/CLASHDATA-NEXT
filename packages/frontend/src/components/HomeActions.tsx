"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HomeActionsProps {
  isAuthenticated: boolean;
}

export function HomeActions({ isAuthenticated }: HomeActionsProps) {
  if (isAuthenticated) {
    return (
      <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all">
        <Link href="/organizations">Minhas Organizações</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all">
        <Link href="/sign-up">Começar Agora</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="text-lg px-8 h-12 border-2 hover:bg-primary/5 transition-all">
        <Link href="/sign-in">Entrar</Link>
      </Button>
    </>
  );
}
