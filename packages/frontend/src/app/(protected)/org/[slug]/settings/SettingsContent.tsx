"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Settings,
  Users,
  Mail,
  Trash2,
  Save,
  Loader2,
  Search,
  X,
  AlertTriangle,
  UserPlus,
  Clock,
  Check,
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
} from "@/components/ui/alert-dialog";
import {
  updateOrganization,
  deleteOrganization,
  removeMember,
  sendInvite,
  cancelInvite,
  getInvitesByOrganization,
  searchUsersByEmail,
  type Invite,
} from "@/lib/api";

interface Member {
  id: string;
  userId: string;
  role: string;
  user?: { id?: string; name?: string; email?: string; image?: string | null };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  members?: Member[];
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "general",  label: "Geral",      icon: Settings },
  { id: "members",  label: "Membros",    icon: Users },
  { id: "invites",  label: "Convites",   icon: Mail },
  { id: "danger",   label: "Perigo",     icon: Trash2 },
] as const;

type SectionId = (typeof NAV)[number]["id"];

// ─── Feedback ─────────────────────────────────────────────────────────────────

function Feedback({ msg }: { msg: { type: "success" | "error"; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={cn(
      "px-4 py-3 rounded-lg text-sm border",
      msg.type === "error"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
    )}>
      {msg.text}
    </div>
  );
}

function initials(name?: string) {
  return (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── General ─────────────────────────────────────────────────────────────────

function GeneralSection({ org }: { org: Organization }) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isDirty = name !== org.name || slug !== org.slug;

  function flash(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) return flash("error", "Nome e slug são obrigatórios.");
    setLoading(true);
    try {
      await updateOrganization(org.id, { name, slug });
      flash("success", "Organização atualizada com sucesso.");
      if (slug !== org.slug) router.push(`/org/${slug}/settings`);
    } catch (err: any) {
      flash("error", err.message ?? "Erro ao atualizar organização.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Informações gerais</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Nome e URL da organização.</p>
      </div>

      <Feedback msg={msg} />

      <div className="rounded-xl border bg-card p-6 space-y-4 max-w-sm">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Nome</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da organização"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-slug">Slug</Label>
          <Input
            id="org-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="slug-da-organizacao"
          />
          <p className="text-xs text-muted-foreground">
            URL: <span className="font-mono">/org/{slug}</span>
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={loading || !isDirty}>
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

// ─── Members ─────────────────────────────────────────────────────────────────

function MembersSection({ org, currentUserId }: { org: Organization; currentUserId: string }) {
  const [members, setMembers] = useState<Member[]>(org.members ?? []);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function flash(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleRemove(member: Member) {
    setRemovingId(member.id);
    try {
      await removeMember(org.id, member.userId);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      flash("success", `${member.user?.name ?? "Membro"} removido.`);
    } catch {
      flash("error", "Erro ao remover membro.");
    } finally {
      setRemovingId(null);
      setConfirmId(null);
    }
  }

  const ROLE_LABEL: Record<string, string> = {
    owner: "Proprietário",
    admin: "Admin",
    member: "Membro",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Membros</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{members.length} {members.length === 1 ? "membro" : "membros"} nesta organização.</p>
      </div>

      <Feedback msg={msg} />

      <div className="rounded-xl border bg-card divide-y">
        {members.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum membro.</div>
        )}
        {members.map((m) => {
          const isMe = m.userId === currentUserId;
          const isOwner = m.role === "owner";
          const canRemove = !isMe && !isOwner;
          return (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={m.user?.image ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {initials(m.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.user?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{m.user?.email}</p>
              </div>
              <Badge variant={isOwner ? "default" : "secondary"} className="text-xs shrink-0">
                {ROLE_LABEL[m.role] ?? m.role}
              </Badge>
              {canRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setConfirmId(m.id)}
                  disabled={removingId === m.id}
                >
                  {removingId === m.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <X className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!confirmId} onOpenChange={(v) => !v && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              O membro perderá acesso à organização imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                const m = members.find((x) => x.id === confirmId);
                if (m) handleRemove(m);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Invites ─────────────────────────────────────────────────────────────────

function InvitesSection({ org }: { org: Organization }) {
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function flash(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  useEffect(() => {
    getInvitesByOrganization(org.id)
      .then(setInvites)
      .finally(() => setLoadingInvites(false));
  }, [org.id]);

  async function handleSearch() {
    if (!email.trim()) return;
    setSearching(true);
    try {
      const data = await searchUsersByEmail(email.trim());
      setResults(data);
      if (data.length === 0) flash("error", "Nenhum usuário encontrado com esse email.");
    } catch {
      flash("error", "Erro ao buscar usuário.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSend(userId: string, userName: string) {
    setSendingId(userId);
    try {
      await sendInvite(org.id, userId);
      const updated = await getInvitesByOrganization(org.id);
      setInvites(updated);
      setResults([]);
      setEmail("");
      flash("success", `Convite enviado para ${userName}.`);
    } catch (err: any) {
      flash("error", err.message ?? "Erro ao enviar convite.");
    } finally {
      setSendingId(null);
    }
  }

  async function handleCancel(inviteId: string) {
    setCancelingId(inviteId);
    try {
      await cancelInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch {
      flash("error", "Erro ao cancelar convite.");
    } finally {
      setCancelingId(null);
    }
  }

  const pending = invites.filter((i) => i.status === "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Convites</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Convide usuários para esta organização pelo email.</p>
      </div>

      <Feedback msg={msg} />

      {/* Search */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Label>Buscar usuário por email</Label>
        <div className="flex gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="email@exemplo.com"
              className="pl-9"
            />
          </div>
          <Button size="sm" onClick={handleSearch} disabled={searching || !email.trim()}>
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buscar"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="divide-y rounded-lg border">
            {results.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={u.image} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSend(u.id, u.name)}
                  disabled={!!sendingId}
                >
                  {sendingId === u.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <><UserPlus className="h-3.5 w-3.5 mr-1.5" />Convidar</>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invites */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Convites pendentes ({pending.length})
        </p>
        {loadingInvites ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum convite pendente.
          </div>
        ) : (
          <div className="rounded-xl border bg-card divide-y">
            {pending.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">ID: {inv.userId}</p>
                  <Badge variant="secondary" className="text-[10px] mt-0.5">Pendente</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleCancel(inv.id)}
                  disabled={cancelingId === inv.id}
                >
                  {cancelingId === inv.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <X className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Danger ───────────────────────────────────────────────────────────────────

function DangerSection({ org }: { org: Organization }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteOrganization(org.id);
      router.push("/organizations");
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Zona de perigo</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Ações irreversíveis para esta organização.</p>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Excluir organização</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Todos os clãs, membros e dados serão permanentemente removidos. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Excluir organização
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {org.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Digite <strong>{org.slug}</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={org.slug}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={confirm !== org.slug || loading}
              onClick={handleDelete}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsContent({
  organization,
  currentUserId,
}: {
  organization: Organization;
  currentUserId: string;
}) {
  const [active, setActive] = useState<SectionId>("general");

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as configurações de <span className="font-medium text-foreground">{organization.name}</span>
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="hidden sm:flex flex-col gap-1 w-48 shrink-0">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors",
                id === "danger" && active !== "danger" && "text-destructive/70 hover:text-destructive",
                active === id
                  ? id === "danger" ? "bg-destructive/10 text-destructive" : "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="sm:hidden w-full mb-4">
          <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  active === id
                    ? id === "danger"
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {active === "general" && <GeneralSection org={organization} />}
          {active === "members" && <MembersSection org={organization} currentUserId={currentUserId} />}
          {active === "invites" && <InvitesSection org={organization} />}
          {active === "danger"  && <DangerSection org={organization} />}
        </div>
      </div>
    </div>
  );
}
