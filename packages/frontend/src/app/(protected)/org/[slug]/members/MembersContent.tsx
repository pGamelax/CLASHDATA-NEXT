"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getInvitesByOrganization,
  sendInvite,
  cancelInvite,
  getSession,
  searchUsersByEmail,
  removeMember,
  type Invite,
} from "@/lib/api";
import { UserPlus, X, Mail, Search, RefreshCw, Users2, UserCheck, Clock, CheckCircle2, XCircle, Crown, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  members?: Member[];
}

export function MembersContent({ organization: initialOrganization }: { organization: Organization }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization>(initialOrganization);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadOrganizationData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const orgResponse = await fetch(
        `${API_URL}/organizations/${organization.id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        }
      );

      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        if (orgData.organization) {
          // Atualiza o estado da organização com os membros
          setOrganization({
            ...organization,
            members: orgData.organization.members || [],
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar organização:", error);
    }
  };

  const isOwner = (organization.members || []).some(
    (m) => m.userId === currentUser?.id && m.role === "owner"
  ) || currentUser?.role === "admin";

  useEffect(() => {
    async function loadData() {
      try {
        const session = await getSession();
        setCurrentUser(session?.user || null);

        await loadOrganizationData();

        const [invitesData] = await Promise.all([
          getInvitesByOrganization(organization.id),
        ]);
        setInvites(invitesData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setMessage({ type: "error", text: "Erro ao carregar dados" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [organization.id]);

  // Escuta eventos de mudança de organização e atualiza periodicamente
  useEffect(() => {
    const handleOrganizationChange = async () => {
      await loadOrganizationData();
      const invitesData = await getInvitesByOrganization(organization.id);
      setInvites(invitesData);
    };

    // Polling a cada 3 segundos para atualizar membros
    const interval = setInterval(() => {
      loadOrganizationData();
      getInvitesByOrganization(organization.id).then(setInvites).catch(console.error);
    }, 3000);

    window.addEventListener("organizationChanged", handleOrganizationChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("organizationChanged", handleOrganizationChange);
    };
  }, [organization.id]);

  const handleSendInvite = async () => {
    if (!email.trim()) {
      setMessage({ type: "error", text: "Digite um email" });
      return;
    }

    // Buscar usuário por email
    const user = allUsers.find((u) => u.email === email.trim());
    if (!user) {
      setMessage({ type: "error", text: "Usuário não encontrado com este email" });
      return;
    }

    // Verificar se já é membro
    if ((organization.members || []).some((m) => m.userId === user.id)) {
      setMessage({ type: "error", text: "Este usuário já é membro da organização" });
      return;
    }

    // Verificar se já existe convite pendente
    if (invites.some((i) => i.userId === user.id && i.status === "PENDING")) {
      setMessage({ type: "error", text: "Já existe um convite pendente para este usuário" });
      return;
    }

    setSendingInvite(true);
    setMessage(null);
    try {
      await sendInvite(organization.id, user.id);
      setMessage({ type: "success", text: "Convite enviado com sucesso" });
      setEmail("");
      // Recarregar convites e organização
      await loadOrganizationData();
      const invitesData = await getInvitesByOrganization(organization.id);
      setInvites(invitesData);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao enviar convite" });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId);
      setMessage({ type: "success", text: "Convite cancelado" });
      // Recarregar convites e organização
      await loadOrganizationData();
      const invitesData = await getInvitesByOrganization(organization.id);
      setInvites(invitesData);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao cancelar convite" });
    }
  };

  // Buscar usuários por email quando o email mudar
  useEffect(() => {
    const searchUsers = async () => {
      if (email.trim().length >= 3) {
        try {
          const users = await searchUsersByEmail(email);
          setAllUsers(users);
        } catch (error) {
          console.error("Erro ao buscar usuários:", error);
          setAllUsers([]);
        }
      } else {
        setAllUsers([]);
      }
    };

    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const filteredMembers = (organization.members || []).filter((member) => {
    const search = searchTerm.toLowerCase();
    return (
      member.user.name?.toLowerCase().includes(search) ||
      member.user.email.toLowerCase().includes(search)
    );
  });

  const filteredInvites = invites.filter((invite) => {
    const search = searchTerm.toLowerCase();
    return (
      invite.user?.name?.toLowerCase().includes(search) ||
      invite.user?.email.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Membros</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
              Gerencie os membros e convites da organização
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await loadOrganizationData();
              const invitesData = await getInvitesByOrganization(organization.id);
              setInvites(invitesData);
            }}
            className="w-full sm:w-auto shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar membros ou convites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Enviar convite (apenas owner) */}
        {isOwner && (
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Enviar Convite</CardTitle>
                  <CardDescription>
                    Convide um usuário para participar da organização
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative min-w-0">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="email"
                      placeholder="Digite o email do usuário..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && allUsers.length > 0) {
                          handleSendInvite();
                        }
                      }}
                      className="pl-10"
                    />
                    {allUsers.length > 0 && email.trim().length >= 3 && (
                      <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                        {allUsers.map((user) => (
                          <div
                            key={user.id}
                            className="p-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0"
                            onClick={() => {
                              setEmail(user.email);
                              setAllUsers([]);
                            }}
                          >
                            <p className="font-medium text-sm">{user.name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSendInvite}
                    disabled={sendingInvite || !email.trim()}
                    size="default"
                    className="w-full sm:w-auto shrink-0"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {sendingInvite ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Membros - Visível para todos os membros */}
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Membros ({filteredMembers.length})</CardTitle>
                <CardDescription>Usuários que fazem parte da organização</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!organization.members || filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum membro encontrado</p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 shrink-0">
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback className="text-xs sm:text-sm font-semibold">
                          {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate text-sm sm:text-base">
                            {member.user.name || "Sem nome"}
                          </p>
                          {member.role === "owner" && (
                            <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <Badge 
                        variant={member.role === "owner" ? "default" : "secondary"}
                        className="gap-1.5 px-2 sm:px-3 py-1 text-xs shrink-0"
                      >
                        {member.role === "owner" ? (
                          <>
                            <Crown className="h-3 w-3" />
                            Dono
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Membro
                          </>
                        )}
                      </Badge>
                      {isOwner && member.role !== "owner" && (
                        <ConfirmationDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Remover Membro"
                          description={`Tem certeza que deseja remover ${member.user.name || member.user.email} da organização? Esta ação não pode ser desfeita.`}
                          confirmationText={member.user.name || member.user.email}
                          onConfirm={async () => {
                            try {
                              await removeMember(organization.id, member.userId);
                              setMessage({ type: "success", text: "Membro removido com sucesso" });
                              await loadOrganizationData();
                            } catch (error: any) {
                              setMessage({ type: "error", text: error.message || "Erro ao remover membro" });
                            }
                          }}
                          confirmButtonText="Remover Membro"
                          confirmButtonVariant="destructive"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Convites */}
        {isOwner && (
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Convites ({filteredInvites.length})</CardTitle>
                  <CardDescription>Convites pendentes e históricos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredInvites.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhum convite encontrado</p>
                  </div>
                ) : (
                  filteredInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 shrink-0">
                          <AvatarImage src={invite.user?.image || undefined} />
                          <AvatarFallback className="text-xs sm:text-sm font-semibold">
                            {invite.user?.name?.[0]?.toUpperCase() || invite.user?.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate text-sm sm:text-base">
                            {invite.user?.name || "Sem nome"}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{invite.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <Badge
                          variant={
                            invite.status === "PENDING"
                              ? "default"
                              : invite.status === "ACCEPTED"
                              ? "secondary"
                              : "outline"
                          }
                          className="gap-1.5 px-2 sm:px-3 py-1 text-xs shrink-0"
                        >
                          {invite.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {invite.status === "ACCEPTED" && <CheckCircle2 className="h-3 w-3" />}
                          {invite.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                          {invite.status === "PENDING"
                            ? "Pendente"
                            : invite.status === "ACCEPTED"
                            ? "Aceito"
                            : invite.status === "REJECTED"
                            ? "Rejeitado"
                            : "Expirado"}
                        </Badge>
                        {invite.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(invite.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
