"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getPendingInvites, acceptInvite, rejectInvite, type Invite } from "@/lib/api";

export interface PendingInvitesState {
  pendingInvites: Invite[];
  loading: boolean;
  message: { type: "success" | "error"; text: string } | null;
  handleAccept: (inviteId: string) => Promise<void>;
  handleReject: (inviteId: string) => Promise<void>;
}

export function usePendingInvites(): PendingInvitesState {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      const data = await getPendingInvites();
      setInvites(data);
    } catch {
      // Silently fail for invites — not critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvites();
    const interval = setInterval(loadInvites, 30_000);
    return () => clearInterval(interval);
  }, [loadInvites]);

  const handleAccept = useCallback(
    async (inviteId: string) => {
      try {
        await acceptInvite(inviteId);
        setMessage({ type: "success", text: "Convite aceito com sucesso!" });
        const invite = invites.find((i) => i.id === inviteId);
        await loadInvites();
        if (invite?.organization?.slug) {
          window.dispatchEvent(new CustomEvent("organizationChanged"));
          setTimeout(() => {
            router.push(`/org/${invite.organization!.slug}`);
            router.refresh();
          }, 500);
        }
      } catch (error: any) {
        setMessage({ type: "error", text: error.message || "Erro ao aceitar convite" });
      }
    },
    [invites, loadInvites, router]
  );

  const handleReject = useCallback(
    async (inviteId: string) => {
      try {
        await rejectInvite(inviteId);
        setMessage({ type: "success", text: "Convite rejeitado" });
        await loadInvites();
      } catch (error: any) {
        setMessage({ type: "error", text: error.message || "Erro ao rejeitar convite" });
      }
    },
    [loadInvites]
  );

  const pendingInvites = invites.filter((i) => i.status === "PENDING");

  return { pendingInvites, loading, message, handleAccept, handleReject };
}
