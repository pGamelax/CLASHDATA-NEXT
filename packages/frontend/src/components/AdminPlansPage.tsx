"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Star, ChevronUp, ChevronDown,
  Check, X, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/plans";
import {
  type PlanConfig,
  getAdminPlans, createAdminPlan, updateAdminPlan, deleteAdminPlan, seedAdminPlans,
} from "@/lib/api";
import {
  ICON_OPTIONS, COLOR_OPTIONS, ICON_LABELS, COLOR_LABELS,
  getPlanIcon, getPlanColors,
} from "@/lib/plan-presets";

const EMPTY_FORM: Omit<PlanConfig, "id" | "createdAt" | "updatedAt"> = {
  key: "",
  name: "",
  description: "",
  monthlyPrice: 0,
  quarterlyPrice: 0,
  yearlyPrice: 0,
  originalQuarterlyPrice: null,
  originalYearlyPrice: null,
  maxClans: 1,
  maxInvites: 1,
  icon: "shield",
  color: "blue",
  features: [],
  isPopular: false,
  isActive: true,
  sortOrder: 0,
};

export function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PlanConfig | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [featuresText, setFeaturesText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setPlans(await getAdminPlans());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingPlan(null);
    setForm({ ...EMPTY_FORM, sortOrder: plans.length + 1 });
    setFeaturesText("");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(plan: PlanConfig) {
    setEditingPlan(plan);
    setForm({
      key: plan.key,
      name: plan.name,
      description: plan.description ?? "",
      monthlyPrice: plan.monthlyPrice,
      quarterlyPrice: plan.quarterlyPrice,
      yearlyPrice: plan.yearlyPrice,
      originalQuarterlyPrice: plan.originalQuarterlyPrice,
      originalYearlyPrice: plan.originalYearlyPrice,
      maxClans: plan.maxClans,
      maxInvites: plan.maxInvites,
      icon: plan.icon,
      color: plan.color,
      features: plan.features,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setFeaturesText(plan.features.join("\n"));
    setError(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
      };
      if (editingPlan) {
        await updateAdminPlan(editingPlan.id, payload);
      } else {
        await createAdminPlan(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plan: PlanConfig) {
    setSaving(true);
    try {
      await deleteAdminPlan(plan.id);
      setDeleteConfirm(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setSaving(true);
    try {
      await seedAdminPlans();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(plan: PlanConfig) {
    await updateAdminPlan(plan.id, { isActive: !plan.isActive });
    await load();
  }

  async function moveOrder(plan: PlanConfig, direction: "up" | "down") {
    const newOrder = direction === "up" ? plan.sortOrder - 1 : plan.sortOrder + 1;
    await updateAdminPlan(plan.id, { sortOrder: newOrder });
    await load();
  }

  const f = form;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os planos exibidos na página de preços
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Atualizar
          </Button>
          {plans.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={saving}>
              Seed padrão
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Novo plano
          </Button>
        </div>
      </div>

      {/* Plan cards grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <p>Nenhum plano cadastrado.</p>
          <Button variant="outline" onClick={handleSeed}>Criar planos padrão</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {plans.map((plan, idx) => {
            const Icon = getPlanIcon(plan.icon);
            const colors = getPlanColors(plan.color);
            return (
              <Card key={plan.id} className={cn("relative", !plan.isActive && "opacity-50")}>
                {plan.isPopular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                      <Star className="h-3 w-3 mr-1" />POPULAR
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-2 rounded-xl bg-linear-to-br border-2", colors.gradient, colors.border)}>
                        <Icon className={cn("h-5 w-5", colors.icon)} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                        <p className="text-[11px] text-muted-foreground font-mono">{plan.key}</p>
                      </div>
                    </div>
                    <Badge variant={plan.isActive ? "secondary" : "outline"} className="text-[10px]">
                      {plan.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-muted p-2">
                      <p className="font-bold text-sm">{formatBRL(plan.monthlyPrice)}</p>
                      <p className="text-muted-foreground">mês</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <p className="font-bold text-sm">{formatBRL(plan.quarterlyPrice)}</p>
                      <p className="text-muted-foreground">trim</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <p className="font-bold text-sm">{formatBRL(plan.yearlyPrice)}</p>
                      <p className="text-muted-foreground">ano</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{plan.maxClans} clã{plan.maxClans !== 1 && "s"}</span>
                    <span>·</span>
                    <span>{plan.maxInvites} convite{plan.maxInvites !== 1 && "s"}</span>
                    <span>·</span>
                    <span>{plan.features.length} features</span>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveOrder(plan, "up")} disabled={idx === 0}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveOrder(plan, "down")} disabled={idx === plans.length - 1}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(plan)}>
                      {plan.isActive ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(plan)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Key (identificador único)</Label>
              <Input value={f.key} onChange={(e) => setForm({ ...f, key: e.target.value.toUpperCase() })} placeholder="MESTRE" disabled={!!editingPlan} />
            </div>
            <div className="space-y-1.5">
              <Label>Nome exibido</Label>
              <Input value={f.name} onChange={(e) => setForm({ ...f, name: e.target.value })} placeholder="Mestre" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descrição</Label>
              <Input value={f.description ?? ""} onChange={(e) => setForm({ ...f, description: e.target.value })} placeholder="Descrição curta do plano" />
            </div>

            {/* Prices */}
            <div className="space-y-1.5">
              <Label>Preço mensal (centavos)</Label>
              <Input type="number" value={f.monthlyPrice} onChange={(e) => setForm({ ...f, monthlyPrice: +e.target.value })} />
              <p className="text-xs text-muted-foreground">{formatBRL(f.monthlyPrice)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Preço trimestral (centavos)</Label>
              <Input type="number" value={f.quarterlyPrice} onChange={(e) => setForm({ ...f, quarterlyPrice: +e.target.value })} />
              <p className="text-xs text-muted-foreground">{formatBRL(f.quarterlyPrice)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Preço original trimestral (centavos)</Label>
              <Input type="number" value={f.originalQuarterlyPrice ?? ""} onChange={(e) => setForm({ ...f, originalQuarterlyPrice: e.target.value ? +e.target.value : null })} placeholder="Opcional (sem desconto)" />
            </div>
            <div className="space-y-1.5">
              <Label>Preço anual (centavos)</Label>
              <Input type="number" value={f.yearlyPrice} onChange={(e) => setForm({ ...f, yearlyPrice: +e.target.value })} />
              <p className="text-xs text-muted-foreground">{formatBRL(f.yearlyPrice)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Preço original anual (centavos)</Label>
              <Input type="number" value={f.originalYearlyPrice ?? ""} onChange={(e) => setForm({ ...f, originalYearlyPrice: e.target.value ? +e.target.value : null })} placeholder="Opcional (sem desconto)" />
            </div>

            {/* Limits */}
            <div className="space-y-1.5">
              <Label>Máx. clãs</Label>
              <Input type="number" min={1} value={f.maxClans} onChange={(e) => setForm({ ...f, maxClans: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Máx. convites</Label>
              <Input type="number" min={0} value={f.maxInvites} onChange={(e) => setForm({ ...f, maxInvites: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input type="number" value={f.sortOrder} onChange={(e) => setForm({ ...f, sortOrder: +e.target.value })} />
            </div>

            {/* Icon */}
            <div className="col-span-2 space-y-1.5">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((key) => {
                  const Ic = getPlanIcon(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...f, icon: key })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                        f.icon === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <Ic className="h-4 w-4" />
                      <span>{ICON_LABELS[key]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            <div className="col-span-2 space-y-1.5">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((key) => {
                  const cls = getPlanColors(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...f, color: key })}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                        f.color === key ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className={cn("h-3 w-3 rounded-full", cls.icon.replace("text-", "bg-"))} />
                      {COLOR_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div className="col-span-2 space-y-1.5">
              <Label>Features (uma por linha)</Label>
              <textarea
                className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm resize-y"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder={"3 Clãs\n3 Convites\nDashboard Completo"}
              />
              <p className="text-xs text-muted-foreground">{featuresText.split("\n").filter(Boolean).length} features</p>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={f.isPopular} onChange={(e) => setForm({ ...f, isPopular: e.target.checked })} className="h-4 w-4" />
                <span className="text-sm">Marcar como popular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={f.isActive} onChange={(e) => setForm({ ...f, isActive: e.target.checked })} className="h-4 w-4" />
                <span className="text-sm">Ativo</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive border border-destructive/20 bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !f.key || !f.name}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPlan ? "Salvar alterações" : "Criar plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir plano</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o plano <strong>{deleteConfirm?.name}</strong>?
            Assinaturas existentes não serão afetadas.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
