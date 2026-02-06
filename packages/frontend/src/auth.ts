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
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const refetch = async () => {
    if (!session?.user) {
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
      setData(null);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [session?.user?.id]);

  return { data, isPending, refetch };
}
