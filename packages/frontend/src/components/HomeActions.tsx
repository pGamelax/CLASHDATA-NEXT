"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface HomeActionsProps {
  isAuthenticated: boolean;
}

export function HomeActions({ isAuthenticated }: HomeActionsProps) {
  const router = useRouter();

  if (isAuthenticated) {
    return (
      <Button 
        size="lg" 
        className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all"
        onClick={() => router.push("/organizations")}
      >
        Minhas Organizações
      </Button>
    );
  }

  return (
    <>
      <Button 
        size="lg" 
        className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all"
        onClick={() => router.push("/sign-up")}
      >
        Começar Agora
      </Button>
      <Button 
        size="lg" 
        variant="outline" 
        className="text-lg px-8 h-12 border-2 hover:bg-primary/5 transition-all"
        onClick={() => router.push("/sign-in")}
      >
        Entrar
      </Button>
    </>
  );
}
