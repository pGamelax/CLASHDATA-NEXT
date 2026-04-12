"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Shield,
  Search,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Users,
  Crown,
  Star,
  Zap,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ── Config ────────────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  LEGEND:  { label: "Legend",  color: "text-purple-400", icon: Crown  },
  TITA:    { label: "Titã",    color: "text-blue-400",   icon: Star   },
  CAMPEAO: { label: "Campeão", color: "text-green-400",  icon: Zap    },
  MESTRE:  { label: "Mestre",  color: "text-yellow-400", icon: Shield },
};

const STATUS_CONFIG: Record<string, { label: string; cn: string }> = {
  ACTIVE:    { label: "Ativa",     cn: "bg-green-500/15 text-green-400 border-green-500/30"  },
  TRIAL:     { label: "Trial",     cn: "bg-blue-500/15 text-blue-400 border-blue-500/30"     },
  EXPIRED:   { label: "Expirada",  cn: "bg-red-500/15 text-red-400 border-red-500/30"        },
  CANCELLED: { label: "Cancelada", cn: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"     },
};

const DAY_PRESETS = [30, 60, 90, 180, 365];

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="hidden sm:block h-3 w-28" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

// ── Subscription Modal ────────────────────────────────────────────────────────

interface SubModalProps {
  clan: any;
  open: boolean;
  onClose: () => void;
  onUpdated: (clanId: string, newSub: any) => void;
}

function SubscriptionModal({ clan, open, onClose, onUpdated }: SubModalProps) {
  const sub = clan?.subscription;

  const [plan, setPlan] = useState(sub?.plan ?? "MESTRE");
  const [days, setDays] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveDays = customDays ? parseInt(customDays) || 0 : days;

  const handleAssignOrRenew = async () => {
    if (effectiveDays <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const activeUntil = new Date(Date.now() + effectiveDays * 86400000).toISOString();
      const res = await fetch(`${API_URL}/admin/subscriptions/manage`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: clan.owner?.email,
          newStatus: "ACTIVE",
          activeUntil,
          clanTag: clan.tag,
          plan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao salvar assinatura");
      onUpdated(clan.id, data.subscription ?? data.sub ?? { plan, status: "ACTIVE", currentPeriodEnd: activeUntil });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/clans/${clan.id}/cancel-subscription`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao cancelar");
      onUpdated(clan.id, { ...sub, status: "CANCELLED" });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  const expiryDate = sub?.currentPeriodEnd || sub?.trialEndsAt || null;
  const daysLeft = daysUntil(expiryDate);
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && sub?.status === "ACTIVE";
  const statusCfg = sub ? STATUS_CONFIG[sub.status] : null;
  const planCfg = sub ? PLAN_CONFIG[sub.plan] : null;
  const PlanIcon = planCfg?.icon ?? CreditCard;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Assinatura — {clan?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current subscription info */}
          {sub ? (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlanIcon className={cn("h-4 w-4", planCfg?.color || "text-muted-foreground")} />
                  <span className="font-semibold text-sm">{planCfg?.label ?? sub.plan}</span>
                </div>
                {statusCfg && (
                  <Badge className={cn("text-[11px] px-2 h-5 border", statusCfg.cn)}>
                    {statusCfg.label}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <span className="text-muted-foreground">Provedor</span>
                  <p className="font-medium capitalize">{sub.paymentProvider || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Criada em</span>
                  <p className="font-medium">{new Date(sub.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                {expiryDate && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Expira em</span>
                    <p className={cn("font-medium flex items-center gap-1", isExpiringSoon && "text-amber-400")}>
                      {isExpiringSoon && <Clock className="h-3 w-3" />}
                      {new Date(expiryDate).toLocaleDateString("pt-BR")}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className="text-muted-foreground font-normal">({daysLeft}d restantes)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              <CreditCard className="h-6 w-6 mx-auto mb-2 opacity-30" />
              Nenhuma assinatura ativa
            </div>
          )}

          {/* Assign / Renew form */}
          <div className="space-y-4">
            <p className="text-sm font-semibold">{sub ? "Renovar / Alterar" : "Atribuir assinatura"}</p>

            {/* Plan select */}
            <div className="space-y-2">
              <Label className="text-xs">Plano</Label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(PLAN_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setPlan(key)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-[11px] font-medium transition-all",
                        plan === key
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", plan === key ? cfg.color : "")} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Days */}
            <div className="space-y-2">
              <Label className="text-xs">Duração</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_PRESETS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDays(d); setCustomDays(""); }}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                      days === d && !customDays
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <Input
                placeholder="Ou informe os dias manualmente..."
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value.replace(/\D/g, ""))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 gap-1.5"
              onClick={handleAssignOrRenew}
              disabled={saving || effectiveDays <= 0}
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCircle2 className="h-3.5 w-3.5" />}
              {sub ? "Renovar" : "Atribuir"}
            </Button>

            {sub && sub.status !== "CANCELLED" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" disabled={cancelling}>
                    {cancelling
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <XCircle className="h-3.5 w-3.5" />}
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A assinatura de <strong>{clan.name}</strong> será cancelada imediatamente. O clan perderá o acesso às funcionalidades premium.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminClansPage() {
  const [clans, setClans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [subModal, setSubModal] = useState<any | null>(null);

  const fetchClans = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/admin/clans`, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar clans");
      const data = await res.json();
      setClans(data.data || []);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar clans");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchClans(); }, [fetchClans]);

  const handleDelete = async (clanId: string) => {
    setDeleting(clanId);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_URL}/admin/clans/${clanId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        setDeleteError(err.message || "Erro ao excluir clan");
        return;
      }
      setClans((prev) => prev.filter((c) => c.id !== clanId));
    } catch {
      setDeleteError("Erro ao excluir clan");
    } finally {
      setDeleting(null);
    }
  };

  const handleSubUpdated = (clanId: string, newSub: any) => {
    setClans((prev) =>
      prev.map((c) => (c.id === clanId ? { ...c, subscription: newSub } : c))
    );
  };

  const filtered = clans.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.tag?.toLowerCase().includes(q) ||
      c.owner?.name?.toLowerCase().includes(q) ||
      c.owner?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-muted-foreground" />
            Clans
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando..." : `${clans.length} clan${clans.length !== 1 ? "s" : ""} cadastrado${clans.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => fetchClans(true)} disabled={refreshing || loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Errors */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {deleteError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{deleteError}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tag ou dono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {!loading && (
          <span className="text-sm text-muted-foreground shrink-0">
            {filtered.length} de {clans.length}
          </span>
        )}
      </div>

      {/* List */}
      <Card>
        {loading ? (
          <div>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Shield className="h-8 w-8 opacity-30" />
            <p className="text-sm">{search ? "Nenhum clan encontrado para essa busca." : "Nenhum clan cadastrado."}</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {filtered.map((clan) => {
              const sub = clan.subscription;
              const planCfg = sub ? PLAN_CONFIG[sub.plan] : null;
              const statusCfg = sub ? STATUS_CONFIG[sub.status] : null;
              const PlanIcon = planCfg?.icon || Shield;

              return (
                <div key={clan.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                  {/* Icon */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{clan.name}</p>
                      <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0 h-5">{clan.tag}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {clan.owner && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {clan.owner.name || clan.owner.email}
                        </span>
                      )}
                      {clan.clanLevel && (
                        <span className="text-[11px] text-muted-foreground">Nível {clan.clanLevel}</span>
                      )}
                    </div>
                  </div>

                  {/* Members */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Users className="h-3.5 w-3.5" />
                    {clan.members ?? "—"}
                  </div>

                  {/* Plan */}
                  {planCfg && (
                    <div className={cn("hidden sm:flex items-center gap-1 text-[11px] font-medium shrink-0", planCfg.color)}>
                      <PlanIcon className="h-3 w-3" />
                      {planCfg.label}
                    </div>
                  )}

                  {/* Status */}
                  {statusCfg && (
                    <Badge className={cn("hidden md:inline-flex text-[11px] px-2 h-5 border shrink-0", statusCfg.cn)}>
                      {statusCfg.label}
                    </Badge>
                  )}

                  {/* Subscription button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs shrink-0"
                    onClick={() => setSubModal(clan)}
                  >
                    {sub ? (
                      <><RotateCcw className="h-3 w-3" /> Assinatura</>
                    ) : (
                      <><CreditCard className="h-3 w-3" /> Atribuir</>
                    )}
                  </Button>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" disabled={deleting === clan.id}>
                        {deleting === clan.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir clan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir <strong>{clan.name}</strong> ({clan.tag})? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(clan.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Subscription modal */}
      {subModal && (
        <SubscriptionModal
          clan={subModal}
          open={!!subModal}
          onClose={() => setSubModal(null)}
          onUpdated={handleSubUpdated}
        />
      )}
    </div>
  );
}
