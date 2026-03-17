"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2, Search, Plus, Edit, Trash2, XCircle, RotateCcw,
  Loader2, RefreshCw, AlertCircle, Users, Shield, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createOrganizationWithManualSubscription, reactivateSubscription, getAdminPlans, type PlanConfig } from "@/lib/api";
import { getPlanIcon, getPlanColors } from "@/lib/plan-presets";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const STATUS_CONFIG: Record<string, { label: string; badgeCn: string; dotColor: string }> = {
  ACTIVE:    { label: "Ativa",     badgeCn: "bg-green-500/15 text-green-400 border-green-500/30",  dotColor: "bg-green-500" },
  TRIAL:     { label: "Trial",     badgeCn: "bg-blue-500/15 text-blue-400 border-blue-500/30",     dotColor: "bg-blue-500"  },
  EXPIRED:   { label: "Expirada",  badgeCn: "bg-red-500/15 text-red-400 border-red-500/30",        dotColor: "bg-red-500"   },
  CANCELLED: { label: "Cancelada", badgeCn: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",     dotColor: "bg-zinc-500"  },
};

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="hidden sm:block h-5 w-14 rounded-full" />
      <Skeleton className="hidden md:block h-5 w-16 rounded-full" />
      <Skeleton className="hidden lg:block h-3 w-28" />
      <div className="flex gap-1.5 shrink-0">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

const BLANK_CREATE = { name: "", slug: "", ownerEmail: "", plan: "MESTRE", daysUntilExpiry: 30 };

export function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(BLANK_CREATE);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit
  const [editOrg, setEditOrg] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reactivate
  const [reactivateOrg, setReactivateOrg] = useState<any | null>(null);
  const [reactivateDays, setReactivateDays] = useState(30);
  const [reactivating, setReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);

  // Delete / Cancel
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchOrgs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const [res, fetchedPlans] = await Promise.all([
        fetch(`${API_URL}/admin/organizations`, { credentials: "include" }),
        getAdminPlans(),
      ]);
      if (!res.ok) throw new Error("Falha ao carregar organizações");
      const data = await res.json();
      setOrgs(data.data || []);
      setPlans(fetchedPlans);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await createOrganizationWithManualSubscription(createForm);
      await fetchOrgs();
      setCreateOpen(false);
      setCreateForm(BLANK_CREATE);
    } catch (e: any) {
      setCreateError(e.message || "Erro ao criar organização");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editOrg) return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_URL}/admin/organizations/${editOrg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao salvar");
      }
      await fetchOrgs();
      setEditOrg(null);
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async () => {
    if (!reactivateOrg) return;
    setReactivating(true);
    setReactivateError(null);
    try {
      await reactivateSubscription(reactivateOrg.id, reactivateDays);
      await fetchOrgs();
      setReactivateOrg(null);
    } catch (e: any) {
      setReactivateError(e.message || "Erro ao reativar");
    } finally {
      setReactivating(false);
    }
  };

  const handleCancel = async (orgId: string) => {
    setCancelling(orgId);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/admin/organizations/${orgId}/cancel-subscription`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao cancelar");
      }
      await fetchOrgs();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setCancelling(null);
    }
  };

  const handleDelete = async (orgId: string) => {
    setDeleting(orgId);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/admin/organizations/${orgId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao excluir");
      }
      setOrgs((prev) => prev.filter((o) => o.id !== orgId));
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = orgs.filter((o) => {
    const q = search.toLowerCase();
    return o.name?.toLowerCase().includes(q) || o.slug?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            Organizações
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando..." : `${orgs.length} organização${orgs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchOrgs(true)} disabled={refreshing || loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Atualizar
          </Button>
          <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setCreateError(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Criar Organização
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Organização</DialogTitle>
                <DialogDescription>Cria com assinatura manual (sem Stripe)</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {createError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />{createError}
                  </div>
                )}
                {[
                  { id: "cn", label: "Nome", key: "name", placeholder: "Ex: War Nation", type: "text" },
                  { id: "cs", label: "Slug", key: "slug", placeholder: "ex: war-nation", type: "text" },
                  { id: "ce", label: "Email do dono", key: "ownerEmail", placeholder: "usuario@email.com", type: "email" },
                ].map(({ id, label, key, placeholder, type }) => (
                  <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{label}</Label>
                    <Input id={id} type={type} placeholder={placeholder}
                      value={(createForm as any)[key]}
                      onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Plano</Label>
                    <Select value={createForm.plan} onValueChange={(v) => setCreateForm({ ...createForm, plan: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {plans.map((p) => (
                          <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cd">Dias até expirar</Label>
                    <Input id="cd" type="number" min="1"
                      value={createForm.daysUntilExpiry}
                      onChange={(e) => setCreateForm({ ...createForm, daysUntilExpiry: parseInt(e.target.value) || 30 })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Errors */}
      {(error || actionError) && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error || actionError}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou slug..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {!loading && (
          <span className="text-sm text-muted-foreground shrink-0">{filtered.length} de {orgs.length}</span>
        )}
      </div>

      {/* List */}
      <Card>
        {loading ? (
          <div>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Building2 className="h-8 w-8 opacity-30" />
            <p className="text-sm">{search ? "Nenhuma organização encontrada." : "Nenhuma organização cadastrada."}</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {filtered.map((org) => {
              const sub = org.subscription;
              const statusCfg = sub ? STATUS_CONFIG[sub.status] : null;
              const planData = sub ? plans.find((p) => p.key === sub.plan) : null;
              const PlanIcon = planData ? getPlanIcon(planData.icon) : Building2;
              const planColors = planData ? getPlanColors(planData.color) : null;
              const owner = org.members?.find((m: any) => m.role === "owner");
              const expiryDate = sub?.currentPeriodEnd || sub?.trialEndsAt || null;
              const days = daysUntil(expiryDate);
              const isExpiringSoon = days !== null && days >= 0 && days <= 7 && sub?.status === "ACTIVE";
              const isManual = sub?.paymentProvider === "manual";
              const canReactivate = isManual && (sub?.status === "EXPIRED" || sub?.status === "CANCELLED");

              return (
                <div key={org.id} className={cn(
                  "flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors flex-wrap md:flex-nowrap",
                  isExpiringSoon && "border-l-2 border-l-amber-500/60"
                )}>
                  {/* Icon */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate">{org.name}</p>
                      <span className="text-[11px] font-mono text-muted-foreground">/{org.slug}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {owner && (
                        <span className="text-[11px] text-muted-foreground truncate max-w-40">
                          {owner.user?.name || owner.user?.email || "—"}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />{org._count?.members ?? 0} membros
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Shield className="h-3 w-3" />{org._count?.clans ?? 0} clans
                      </span>
                    </div>
                  </div>

                  {/* Plan */}
                  {sub?.plan ? (
                    <div className={cn("hidden sm:flex items-center gap-1 text-[11px] font-semibold shrink-0", planColors?.icon ?? "text-muted-foreground")}>
                      <PlanIcon className="h-3 w-3" />
                      {planData?.name ?? sub.plan}
                    </div>
                  ) : (
                    <span className="hidden sm:block text-[11px] text-muted-foreground shrink-0">sem plano</span>
                  )}

                  {/* Status */}
                  {statusCfg && (
                    <Badge className={cn("hidden md:inline-flex text-[11px] px-2 h-5 border shrink-0", statusCfg.badgeCn)}>
                      {statusCfg.label}
                    </Badge>
                  )}

                  {/* Expiry */}
                  {expiryDate && (
                    <div className={cn("hidden lg:flex items-center gap-1 text-[11px] shrink-0",
                      isExpiringSoon ? "text-amber-400 font-semibold" : "text-muted-foreground"
                    )}>
                      {isExpiringSoon && <Clock className="h-3 w-3" />}
                      {days !== null && days >= 0
                        ? `${days}d restantes`
                        : new Date(expiryDate).toLocaleDateString("pt-BR")}
                      {isManual && <span className="text-muted-foreground font-normal"> · manual</span>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit */}
                    <Dialog open={editOrg?.id === org.id} onOpenChange={(v) => { if (!v) { setEditOrg(null); setEditError(null); } }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditOrg(org); setEditForm({ name: org.name, slug: org.slug }); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Organização</DialogTitle>
                          <DialogDescription>Atualize nome e slug de <strong>{org.name}</strong></DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                          {editError && (
                            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{editError}
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Label>Nome</Label>
                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Slug</Label>
                            <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => { setEditOrg(null); setEditError(null); }}>Cancelar</Button>
                          <Button onClick={handleSaveEdit} disabled={saving}>
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Salvar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Reactivate */}
                    {canReactivate && (
                      <Dialog open={reactivateOrg?.id === org.id} onOpenChange={(v) => { if (!v) { setReactivateOrg(null); setReactivateError(null); } }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-400"
                            onClick={() => { setReactivateOrg(org); setReactivateDays(30); }}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reativar Assinatura</DialogTitle>
                            <DialogDescription>Reativar assinatura manual de <strong>{org.name}</strong></DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 py-2">
                            {reactivateError && (
                              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{reactivateError}
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <Label>Dias até expiração</Label>
                              <Input type="number" min="1" value={reactivateDays}
                                onChange={(e) => setReactivateDays(parseInt(e.target.value) || 30)} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setReactivateOrg(null); setReactivateError(null); }}>Cancelar</Button>
                            <Button onClick={handleReactivate} disabled={reactivating}>
                              {reactivating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reativando...</> : "Reativar"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Cancel subscription */}
                    {sub && sub.status === "ACTIVE" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-400" disabled={cancelling === org.id}>
                            {cancelling === org.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <XCircle className="h-3.5 w-3.5" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar assinatura</AlertDialogTitle>
                            <AlertDialogDescription>Cancelar assinatura de <strong>{org.name}</strong>? O acesso será revogado.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancel(org.id)}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={deleting === org.id}>
                          {deleting === org.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir organização</AlertDialogTitle>
                          <AlertDialogDescription>
                            Excluir <strong>{org.name}</strong>? Isso remove todos os dados, clans e membros. Ação irreversível.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(org.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
