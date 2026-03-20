"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { authClient } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  User,
  Lock,
  Palette,
  Trash2,
  Check,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  AlertTriangle,
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

// ─── Avatar presets ───────────────────────────────────────────────────────────

const AVATAR_PRESETS = [
  { seed: "Avalon", bg: "b6e3f4" },
  { seed: "Cleo",   bg: "c0aede" },
  { seed: "Ryker",  bg: "ffdfbf" },
  { seed: "Jade",   bg: "d1d4f9" },
  { seed: "Zara",   bg: "ffd5dc" },
  { seed: "Blaze",  bg: "c0e6c0" },
  { seed: "Nova",   bg: "f4d03f" },
  { seed: "Titan",  bg: "f0b27a" },
  { seed: "Luna",   bg: "a9cce3" },
  { seed: "Rex",    bg: "d7bde2" },
  { seed: "Iris",   bg: "a3e4d7" },
  { seed: "Orion",  bg: "fadbd8" },
];

function avatarUrl(seed: string, bg: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=${bg}&radius=50`;
}

function defaultAvatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name || "user")}&backgroundColor=b6e3f4,c0aede,ffdfbf,d1d4f9,ffd5dc,c0e6c0`;
}

// ─── Shared feedback banner ───────────────────────────────────────────────────

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

// ─── Sections ─────────────────────────────────────────────────────────────────

function ProfileSection({ user }: { user: { name: string; email: string; image?: string | null } }) {
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user.image || defaultAvatar(user.name));
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  function flash(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleSaveName() {
    if (!name.trim() || name === user.name) return;
    setSavingName(true);
    try {
      await authClient.updateUser({ name });
      flash("success", "Nome atualizado com sucesso.");
    } catch {
      flash("error", "Erro ao atualizar o nome.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveAvatar() {
    if (!selectedAvatar || selectedAvatar === user.image) return;
    setSavingAvatar(true);
    try {
      await authClient.updateUser({ image: selectedAvatar });
      flash("success", "Avatar atualizado com sucesso.");
    } catch {
      flash("error", "Erro ao atualizar o avatar.");
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Perfil</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Seu nome e avatar visíveis para outros membros.</p>
      </div>

      <Feedback msg={msg} />

      {/* Avatar */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={selectedAvatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Escolha um avatar</p>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-3">
            {AVATAR_PRESETS.map(({ seed, bg }) => {
              const url = avatarUrl(seed, bg);
              const isSelected = selectedAvatar === url;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={cn(
                    "relative h-10 w-10 rounded-full transition-all focus-visible:outline-none",
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "ring-2 ring-transparent ring-offset-2 ring-offset-background hover:ring-border"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={seed} className="h-10 w-10 rounded-full" />
                  {isSelected && (
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary ring-2 ring-background">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleSaveAvatar}
          disabled={savingAvatar || selectedAvatar === user.image}
        >
          {savingAvatar ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-2" />}
          Salvar avatar
        </Button>
      </div>

      {/* Name */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Seu nome exibido na plataforma.</p>
        </div>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          className="max-w-sm"
        />
        <Button
          size="sm"
          onClick={handleSaveName}
          disabled={savingName || !name.trim() || name === user.name}
        >
          {savingName ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : null}
          Salvar nome
        </Button>
      </div>
    </div>
  );
}

function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function flash(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  }

  async function handleChange() {
    if (!current || !next || !confirm) return flash("error", "Preencha todos os campos.");
    if (next.length < 8) return flash("error", "A nova senha precisa ter no mínimo 8 caracteres.");
    if (next !== confirm) return flash("error", "As senhas não coincidem.");

    setLoading(true);
    try {
      const res = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (res.error) throw new Error(res.error.message);
      setCurrent(""); setNext(""); setConfirm("");
      flash("success", "Senha alterada com sucesso. Outras sessões foram encerradas.");
    } catch (err: any) {
      flash("error", err.message ?? "Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  }

  const strength = next.length === 0 ? null : next.length < 6 ? "fraca" : next.length < 10 ? "média" : "forte";
  const strengthColor = strength === "fraca" ? "bg-red-500" : strength === "média" ? "bg-yellow-500" : "bg-green-500";
  const strengthWidth = strength === "fraca" ? "w-1/3" : strength === "média" ? "w-2/3" : "w-full";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Segurança</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Altere sua senha de acesso.</p>
      </div>

      <Feedback msg={msg} />

      <div className="rounded-xl border bg-card p-6 space-y-4 max-w-sm">
        <div className="space-y-1.5">
          <Label htmlFor="current-pw">Senha atual</Label>
          <div className="relative">
            <Input
              id="current-pw"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowCurrent((v) => !v)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-pw">Nova senha</Label>
          <div className="relative">
            <Input
              id="new-pw"
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowNext((v) => !v)}
            >
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {strength && (
            <div className="space-y-1">
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", strengthColor, strengthWidth)} />
              </div>
              <p className="text-xs text-muted-foreground">Força: {strength}</p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-pw">Confirmar nova senha</Label>
          <Input
            id="confirm-pw"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
          {confirm && next && confirm !== next && (
            <p className="text-xs text-destructive">As senhas não coincidem</p>
          )}
        </div>

        <Button size="sm" onClick={handleChange} disabled={loading || !current || !next || !confirm}>
          {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
          Alterar senha
        </Button>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light",  label: "Claro",   icon: Sun },
    { value: "dark",   label: "Escuro",  icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Aparência</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Escolha o tema da interface.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Label>Tema</Label>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {options.map(({ value, label, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all",
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
                {active && <Check className="h-3 w-3 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AccountSection() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await authClient.deleteUser();
      window.location.href = "/sign-in";
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Conta</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Ações permanentes relacionadas à sua conta.</p>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Excluir conta</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Excluir minha conta
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os seus dados, organizações e clãs vinculados serão excluídos.
              Digite <strong>EXCLUIR</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="EXCLUIR"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={confirm !== "EXCLUIR" || loading}
              onClick={handleDelete}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
              Excluir conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "profile",    label: "Perfil",     icon: User },
  { id: "security",   label: "Segurança",  icon: Lock },
  { id: "appearance", label: "Aparência",  icon: Palette },
  { id: "account",    label: "Conta",      icon: Trash2 },
] as const;

type SectionId = (typeof NAV)[number]["id"];

interface UserSettingsClientProps {
  user: { name: string; email: string; image?: string | null };
}

export function UserSettingsClient({ user }: UserSettingsClientProps) {
  const [active, setActive] = useState<SectionId>("profile");

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie as configurações da sua conta.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* Sidebar nav */}
        <nav className="hidden sm:flex flex-col gap-1 w-48 shrink-0">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors",
                active === id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="sm:hidden mb-2 overflow-x-hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden pb-1">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  active === id
                    ? "bg-primary text-primary-foreground border-primary"
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
          {active === "profile"    && <ProfileSection user={user} />}
          {active === "security"   && <SecuritySection />}
          {active === "appearance" && <AppearanceSection />}
          {active === "account"    && <AccountSection />}
        </div>
      </div>
    </div>
  );
}
