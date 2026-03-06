"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface HomeCTAProps {
  isAuthenticated: boolean;
}

export function HomeCTA({ isAuthenticated }: HomeCTAProps) {
  const router = useRouter();

  if (isAuthenticated) {
    return (
      <Button 
        size="lg" 
        className="text-lg px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        onClick={() => router.push("/organizations")}
      >
        Minhas Organizações
      </Button>
    );
  }

  return (
    <Button 
      size="lg" 
      className="text-lg px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      onClick={() => router.push("/sign-up")}
    >
      Criar Conta Grátis
    </Button>
  );
}
