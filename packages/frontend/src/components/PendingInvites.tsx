"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Building2 } from "lucide-react";
import { getPendingInvites, acceptInvite, rejectInvite, type Invite } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PendingInvites() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const data = await getPendingInvites();
      setInvites(data);
    } catch (error) {
      console.error("Erro ao carregar convites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    try {
      await acceptInvite(inviteId);
      setMessage({ type: "success", text: "Convite aceito com sucesso!" });
      await loadInvites();
      // Redireciona para a organização após aceitar
      const invite = invites.find((i) => i.id === inviteId);
      if (invite?.organization?.slug) {
        // Dispara evento para atualizar a lista de organizações
        window.dispatchEvent(new CustomEvent("organizationChanged"));
        setTimeout(() => {
          router.push(`/org/${invite?.organization?.slug}`);
          router.refresh();
        }, 500);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao aceitar convite" });
    }
  };

  const handleReject = async (inviteId: string) => {
    try {
      await rejectInvite(inviteId);
      setMessage({ type: "success", text: "Convite rejeitado" });
      await loadInvites();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao rejeitar convite" });
    }
  };

  const pendingCount = invites.filter((i) => i.status === "PENDING").length;
  const pendingInvites = invites.filter((i) => i.status === "PENDING");

  return (
    <>
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className="fixed top-20 right-4 z-50 max-w-md"
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="relative flex items-center justify-center p-1.5 rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background"
            disabled={loading}
          >
            <Bell className="h-4 w-4" />
            <Badge
              variant={pendingCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs pointer-events-none"
            >
              {loading ? "..." : pendingCount}
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Convites Pendentes ({pendingCount})</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum convite pendente
            </div>
          ) : (
            pendingInvites.map((invite) => (
              <DropdownMenuItem
                key={invite.id}
                className="flex flex-col items-start p-3 cursor-default"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-start gap-2 w-full mb-2">
                  <Building2 className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invite.organization?.name || "Organização"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Convite de {invite.organization?.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 w-full">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(invite.id);
                      setOpen(false);
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(invite.id);
                      setOpen(false);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
