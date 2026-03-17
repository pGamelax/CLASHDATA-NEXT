"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getInvitesByOrganization,
  sendInvite,
  cancelInvite,
  searchUsersByEmail,
  removeMember,
  type Invite,
  type Subscription,
} from "@/lib/api";
import {
  UserPlus,
  X,
  Mail,
  Search,
  RefreshCw,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Crown,
  Trash2,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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

interface Props {
  organization: Organization;
  isOwner: boolean;
  subscription: Subscription | null;
}

type InviteFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

const INVITE_STATUS_CONFIG: Record<
  Invite["status"],
  { label: string; className: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Pendente",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Aceito",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejeitado",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expirado",
    className: "bg-muted text-muted-foreground border-border",
    icon: XCircle,
  },
};

function formatDate(dateString?: string) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "primary" | "amber" | "green" | "blue";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
      <div className={cn("p-2.5 rounded-lg shrink-0", colors[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

export function MembersContent({ organization, isOwner, subscription }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(organization.members ?? []);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteFilter, setInviteFilter] = useState<InviteFilter>("ALL");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadInvites = useCallback(async () => {
    const data = await getInvitesByOrganization(organization.id);
    setInvites(data);
  }, [organization.id]);

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        await loadInvites();
        router.refresh();
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [loadInvites, router]
  );

  useEffect(() => {
    loadInvites().finally(() => setInvitesLoading(false));
  }, [loadInvites]);

  useEffect(() => {
    if (organization.members) setMembers(organization.members);
  }, [organization.members]);

  // Debounced email search
  useEffect(() => {
    setSelectedUser(null);
    if (email.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const users = await searchUsersByEmail(email);
        setSuggestions(users);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [email]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSelectSuggestion = (user: any) => {
    setSelectedUser(user);
    setEmail(user.email);
    setSuggestions([]);
  };

  const handleSendInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return showMessage("error", "Digite um email");

    const user = selectedUser ?? suggestions.find((u) => u.email === trimmed) ?? suggestions[0];
    if (!user) return showMessage("error", "Usuário não encontrado com este email");
    if (members.some((m) => m.userId === user.id))
      return showMessage("error", "Este usuário já é membro");
    if (invites.some((i) => i.userId === user.id && i.status === "PENDING"))
      return showMessage("error", "Já existe um convite pendente para este usuário");

    setSendingInvite(true);
    try {
      await sendInvite(organization.id, user.id);
      setEmail("");
      setSelectedUser(null);
      setSuggestions([]);
      showMessage("success", `Convite enviado para ${user.name ?? user.email}`);
      await loadInvites();
    } catch (err: any) {
      showMessage("error", err.message ?? "Erro ao enviar convite");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId);
      showMessage("success", "Convite cancelado");
      await loadInvites();
    } catch (err: any) {
      showMessage("error", err.message ?? "Erro ao cancelar convite");
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    try {
      await removeMember(organization.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      showMessage("success", `${name} removido com sucesso`);
    } catch (err: any) {
      showMessage("error", err.message ?? "Erro ao remover membro");
    }
  };

  // Derived data
  const ownerCount = members.filter((m) => m.role === "owner").length;
  const regularCount = members.filter((m) => m.role !== "owner").length;
  const pendingInviteCount = invites.filter((i) => i.status === "PENDING").length;
  const inviteLimit = subscription?.usage?.invites;
  const canInvite = !inviteLimit || inviteLimit.canAdd;

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return m.user.name?.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q);
  });

  const filteredInvites = invites.filter((i) => {
    const q = inviteSearch.toLowerCase();
    const matchesSearch =
      i.user?.name?.toLowerCase().includes(q) || i.user?.email?.toLowerCase().includes(q);
    const matchesFilter = inviteFilter === "ALL" || i.status === inviteFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Membros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os membros e convites de{" "}
            <span className="font-medium text-foreground">{organization.name}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Total de Membros"
          value={inviteLimit ? `${regularCount}/${inviteLimit.max}` : members.length}
          sub={inviteLimit ? `${inviteLimit.max - regularCount} vagas disponíveis` : undefined}
          color="primary"
        />
        <StatCard
          icon={Crown}
          label="Proprietários"
          value={ownerCount}
          color="amber"
        />
        <StatCard
          icon={UserCheck}
          label="Membros Ativos"
          value={regularCount}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Convites Pendentes"
          value={pendingInviteCount}
          color="blue"
        />
      </div>

      {/* Invite limit warning */}
      {inviteLimit && !inviteLimit.canAdd && isOwner && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Limite de {inviteLimit.max} {inviteLimit.max === 1 ? "membro" : "membros"} atingido no
            plano atual.{" "}
            <a href={`/org/${organization.slug}/subscription`} className="font-semibold underline">
              Fazer upgrade
            </a>
          </span>
        </div>
      )}

      {/* Feedback */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg text-sm border",
            message.type === "error"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
          )}
        >
          {message.type === "error" ? (
            <XCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Invite form */}
      {isOwner && (
        <Card className={cn(!canInvite && "opacity-60 pointer-events-none")}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">Convidar Usuário</CardTitle>
                <CardDescription>
                  {inviteLimit
                    ? `${regularCount} de ${inviteLimit.max} vagas usadas`
                    : "Convide um usuário para a organização"}
                </CardDescription>
              </div>
              {inviteLimit && (
                <span className="text-xs text-muted-foreground shrink-0">
                  <span className="font-semibold text-foreground">{inviteLimit.current}</span>
                  /{inviteLimit.max}
                </span>
              )}
            </div>
            {inviteLimit && (
              <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    inviteLimit.current >= inviteLimit.max
                      ? "bg-destructive"
                      : inviteLimit.current / inviteLimit.max >= 0.8
                      ? "bg-amber-500"
                      : "bg-primary"
                  )}
                  style={{ width: `${Math.min((inviteLimit.current / inviteLimit.max) * 100, 100)}%` }}
                />
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Digite o email do usuário..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedUser(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                  className="pl-10"
                  disabled={sendingInvite}
                />
                {suggestions.length > 0 && !selectedUser && email.trim().length >= 3 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {suggestions.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0"
                        onClick={() => handleSelectSuggestion(user)}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(user.name?.[0] ?? user.email[0]).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{user.name ?? "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleSendInvite}
                disabled={sendingInvite || !email.trim()}
                className="shrink-0"
              >
                {sendingInvite ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {sendingInvite ? "Enviando..." : "Enviar Convite"}
              </Button>
            </div>

            {selectedUser && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={selectedUser.image ?? undefined} />
                  <AvatarFallback className="text-xs font-semibold">
                    {(selectedUser.name?.[0] ?? selectedUser.email[0]).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{selectedUser.name ?? "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="members" className="flex-1 sm:flex-none gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Membros
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
              {filteredMembers.length}
            </Badge>
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="invites" className="flex-1 sm:flex-none gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Convites
              {pendingInviteCount > 0 && (
                <Badge className="ml-1 text-[10px] px-1.5 py-0 h-4">{pendingInviteCount}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-14 border rounded-xl bg-card">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="font-medium text-sm">Nenhum membro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                {memberSearch
                  ? "Tente outro termo de busca"
                  : "Esta organização ainda não tem membros"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isOwner={isOwner}
                  onRemove={handleRemoveMember}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Invites tab */}
        {isOwner && (
          <TabsContent value="invites" className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar convites..."
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["ALL", "PENDING", "ACCEPTED", "REJECTED", "EXPIRED"] as InviteFilter[]).map(
                  (f) => {
                    const count =
                      f === "ALL" ? invites.length : invites.filter((i) => i.status === f).length;
                    if (f !== "ALL" && count === 0) return null;
                    return (
                      <button
                        key={f}
                        onClick={() => setInviteFilter(f)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                          inviteFilter === f
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {f === "ALL"
                          ? "Todos"
                          : INVITE_STATUS_CONFIG[f as Invite["status"]]?.label ?? f}{" "}
                        ({count})
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {invitesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredInvites.length === 0 ? (
              <div className="text-center py-14 border rounded-xl bg-card">
                <Mail className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-medium text-sm">Nenhum convite encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inviteSearch || inviteFilter !== "ALL"
                    ? "Tente ajustar os filtros"
                    : "Nenhum convite enviado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInvites.map((invite) => (
                  <InviteRow key={invite.id} invite={invite} onCancel={handleCancelInvite} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function MemberRow({
  member,
  isOwner,
  onRemove,
}: {
  member: Member;
  isOwner: boolean;
  onRemove: (userId: string, name: string) => void;
}) {
  const isOwnerRole = member.role === "owner";
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={member.user.image ?? undefined} />
          <AvatarFallback className="text-xs font-semibold">
            {(member.user.name?.[0] ?? member.user.email[0]).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm truncate">{member.user.name ?? "Sem nome"}</p>
            {isOwnerRole && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
            isOwnerRole
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              : "bg-muted text-muted-foreground border-border"
          )}
        >
          {isOwnerRole ? (
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
        </span>

        {isOwner && !isOwnerRole && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover membro</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover{" "}
                  <strong>{member.user.name ?? member.user.email}</strong> da organização? Ele
                  perderá o acesso imediatamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onRemove(member.userId, member.user.name ?? member.user.email)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

function InviteRow({
  invite,
  onCancel,
}: {
  invite: Invite;
  onCancel: (id: string) => void;
}) {
  const cfg = INVITE_STATUS_CONFIG[invite.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={invite.user?.image ?? undefined} />
          <AvatarFallback className="text-xs font-semibold">
            {(invite.user?.name?.[0] ?? invite.user?.email?.[0] ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{invite.user?.name ?? "Sem nome"}</p>
          <p className="text-xs text-muted-foreground truncate">{invite.user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {invite.createdAt && (
          <span className="text-xs text-muted-foreground hidden sm:block">
            {formatDate(invite.createdAt)}
          </span>
        )}
        {invite.expiresAt && invite.status === "PENDING" && (
          <span className="text-xs text-muted-foreground hidden md:block">
            Expira {formatDate(invite.expiresAt)}
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
            cfg.className
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </span>
        {invite.status === "PENDING" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onCancel(invite.id)}
            title="Cancelar convite"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
