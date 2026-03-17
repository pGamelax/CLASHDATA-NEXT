"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createUpgradeCheckoutSession,
  changeSubscriptionPlan,
} from "@/lib/api";
import {
  PLAN_ORDER,
  PLAN_NAMES,
  PLAN_PRICES_CENTS,
  PLAN_LIMITS,
  PLAN_ICONS,
  PLAN_COLORS,
  PERIOD_LABELS,
  PERIOD_NAMES,
  PERIOD_DISCOUNTS,
  formatBRL,
  getPlanLevel,
  isUpgrade,
  isDowngrade,
  type Plan,
  type Period,
} from "@/lib/plans";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: Plan;
  organizationId: string;
  onSuccess?: () => void;
}

const PERIODS: Period[] = ["monthly", "quarterly", "yearly"];

export function PlanUpgradeDialog({
  open,
  onOpenChange,
  currentPlan,
  organizationId,
  onSuccess,
}: Props) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(currentPlan);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSame = selectedPlan === currentPlan;
  const upgrade = !isSame && isUpgrade(currentPlan, selectedPlan);
  const downgrade = !isSame && isDowngrade(currentPlan, selectedPlan);

  const handleConfirm = async () => {
    if (isSame) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createUpgradeCheckoutSession(
        organizationId,
        selectedPlan,
        selectedPeriod
      );
      if (result.url && result.url !== window.location.href) {
        window.location.href = result.url;
        return;
      }
      // No redirect needed — direct plan change
      await changeSubscriptionPlan(organizationId, selectedPlan, selectedPeriod);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message ?? "Erro ao alterar plano");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Alterar Plano</DialogTitle>
          <DialogDescription>
            Escolha o novo plano e período. O valor será calculado proporcionalmente ao tempo restante.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Period toggle */}
          <div>
            <p className="text-sm font-semibold mb-2">Período</p>
            <div className="inline-flex rounded-lg border bg-muted p-1 gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                    selectedPeriod === p
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {PERIOD_NAMES[p]}
                  {PERIOD_DISCOUNTS[p] && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
                      {PERIOD_DISCOUNTS[p]}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div>
            <p className="text-sm font-semibold mb-2">Plano</p>
            <div className="grid grid-cols-2 gap-3">
              {PLAN_ORDER.map((plan) => {
                const Icon = PLAN_ICONS[plan];
                const colors = PLAN_COLORS[plan];
                const price = PLAN_PRICES_CENTS[plan][selectedPeriod];
                const limits = PLAN_LIMITS[plan];
                const selected = selectedPlan === plan;
                const isCurrent = plan === currentPlan;

                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "relative text-left p-4 rounded-lg border-2 transition-all",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    {isCurrent && (
                      <Badge variant="outline" className="absolute top-2 right-2 text-[10px]">
                        Atual
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn("p-1.5 rounded-md bg-linear-to-br", colors.gradient, colors.border, "border")}>
                        <Icon className={cn("h-4 w-4", colors.icon)} />
                      </div>
                      <span className="font-semibold text-sm">{PLAN_NAMES[plan]}</span>
                    </div>
                    <p className="text-base font-bold mb-0.5">
                      {formatBRL(price.amount)}
                      <span className="text-xs font-normal text-muted-foreground">
                        /{PERIOD_LABELS[selectedPeriod]}
                      </span>
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {limits.maxClans} {limits.maxClans === 1 ? "clã" : "clãs"}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {limits.maxInvites} {limits.maxInvites === 1 ? "convite" : "convites"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Change summary */}
          {!isSame && (
            <div className="p-4 rounded-lg border bg-muted/50 text-sm space-y-2">
              <p className="font-semibold">Resumo da alteração</p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {PLAN_NAMES[currentPlan]} → {PLAN_NAMES[selectedPlan]}
                </span>
                <Badge variant={upgrade ? "default" : "secondary"} className="gap-1">
                  {upgrade ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {upgrade ? "Upgrade" : "Downgrade"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                O valor será ajustado proporcionalmente ao tempo restante do período atual.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || isSame}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</>
            ) : upgrade ? (
              <><ArrowUp className="h-4 w-4 mr-2" />Fazer Upgrade</>
            ) : downgrade ? (
              <><ArrowDown className="h-4 w-4 mr-2" />Fazer Downgrade</>
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
