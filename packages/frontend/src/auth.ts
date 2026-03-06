import { createAuthClient } from "better-auth/react";
import { useState, useEffect } from "react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signOut, signUp, useSession } = authClient;

// Hook customizado para organizações
export function useOrganizations() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [data, setData] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const refetch = async () => {
    // Se a sessão ainda está carregando ou não há usuário, não faz requisição
    if (isSessionPending || !session?.user) {
      setData(null);
      setIsPending(false);
      return;
    }

    setIsPending(true);
    try {
      // Usa o endpoint customizado que retorna organizações com subscriptions
      const response = await fetch(`${apiUrl}/organizations/list`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Erro ao buscar organizações:", error);
      setData(null);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    // Só faz refetch se a sessão não estiver pendente
    if (!isSessionPending) {
      refetch();
    }
  }, [session?.user?.id, isSessionPending]);

  return { data, isPending: isPending || isSessionPending, refetch };
}
