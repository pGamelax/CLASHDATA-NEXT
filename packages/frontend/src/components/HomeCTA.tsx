"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HomeCTAProps {
  isAuthenticated: boolean;
}

export function HomeCTA({ isAuthenticated }: HomeCTAProps) {
  if (isAuthenticated) {
    return (
      <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
        <Link href="/organizations">Minhas Organizações</Link>
      </Button>
    );
  }

  return (
    <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
      <Link href="/sign-up">Criar Conta Grátis</Link>
    </Button>
  );
}
