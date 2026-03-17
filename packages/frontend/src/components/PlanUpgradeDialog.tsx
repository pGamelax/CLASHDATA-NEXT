"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPixPayment, getPlans, type PixPaymentData, type PlanConfig } from "@/lib/api";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { getPlanIcon, getPlanColors } from "@/lib/plan-presets";
import { formatBRL } from "@/lib/plans";

type Period = "monthly" | "quarterly" | "yearly";

const PERIODS: { key: Period; label: string; discount: string | null }[] = [
  { key: "monthly",   label: "Mensal",      discount: null      },
  { key: "quarterly", label: "Trimestral",  discount: "10% OFF" },
  { key: "yearly",    label: "Anual",       discount: "20% OFF" },
];

const PERIOD_LABELS: Record<Period, string> = {
  monthly: "mês", quarterly: "trimestre", yearly: "ano",
};

function getPlanPrice(plan: PlanConfig, period: Period) {
  if (period === "monthly")   return plan.monthlyPrice;
  if (period === "quarterly") return plan.quarterlyPrice;
  return plan.yearlyPrice;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  organizationId: string;
  onSuccess?: () => void;
}

export function PlanUpgradeDialog({
  open, onOpenChange, currentPlan, organizationId, onSuccess,
}: Props) {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingPlans(true);
      getPlans().then((p) => {
        setPlans(p);
        setLoadingPlans(false);
      });
      setSelectedPlan(currentPlan);
    }
  }, [open, currentPlan]);

  const currentPlanData = plans.find((p) => p.key === currentPlan);
  const selectedPlanData = plans.find((p) => p.key === selectedPlan);

  const isSame = selectedPlan === currentPlan;
  const currentOrder = currentPlanData?.sortOrder ?? 0;
  const selectedOrder = selectedPlanData?.sortOrder ?? 0;
  const isUpgrade = !isSame && selectedOrder > currentOrder;
  const isDowngrade = !isSame && selectedOrder < currentOrder;

  const handleConfirm = async () => {
    if (isSame) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createPixPayment({
        organizationId,
        plan: selectedPlan,
        period: selectedPeriod,
      });
      setPixData(result.pix);
      setShowPixModal(true);
    } catch (err: any) {
      setError(err.message ?? "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  function handlePixPaid() {
    setShowPixModal(false);
    onSuccess?.();
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Alterar Plano</DialogTitle>
            <DialogDescription>
              Escolha o novo plano e período. Um QR code PIX será gerado para o pagamento.
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
                    key={p.key}
                    onClick={() => setSelectedPeriod(p.key)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                      selectedPeriod === p.key
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p.label}
                    {p.discount && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
                        {p.discount}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan cards */}
            <div>
              <p className="text-sm font-semibold mb-2">Plano</p>
              {loadingPlans ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {plans.map((plan) => {
                    const Icon = getPlanIcon(plan.icon);
                    const colors = getPlanColors(plan.color);
                    const price = getPlanPrice(plan, selectedPeriod);
                    const selected = selectedPlan === plan.key;
                    const isCurrent = plan.key === currentPlan;

                    return (
                      <button
                        key={plan.key}
                        onClick={() => setSelectedPlan(plan.key)}
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
                          <div className={cn("p-1.5 rounded-md bg-linear-to-br border", colors.gradient, colors.border)}>
                            <Icon className={cn("h-4 w-4", colors.icon)} />
                          </div>
                          <span className="font-semibold text-sm">{plan.name}</span>
                        </div>
                        <p className="text-base font-bold mb-0.5">
                          {formatBRL(price)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{PERIOD_LABELS[selectedPeriod]}
                          </span>
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {plan.maxClans} {plan.maxClans === 1 ? "clã" : "clãs"}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {plan.maxInvites} {plan.maxInvites === 1 ? "convite" : "convites"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Change summary */}
            {!isSame && currentPlanData && selectedPlanData && (
              <div className="p-4 rounded-lg border bg-muted/50 text-sm space-y-2">
                <p className="font-semibold">Resumo da alteração</p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {currentPlanData.name} → {selectedPlanData.name}
                  </span>
                  <Badge variant={isUpgrade ? "default" : "secondary"} className="gap-1">
                    {isUpgrade ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {isUpgrade ? "Upgrade" : "Downgrade"}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || isSame || loadingPlans}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</>
              ) : isUpgrade ? (
                <><ArrowUp className="h-4 w-4 mr-2" />Fazer Upgrade</>
              ) : isDowngrade ? (
                <><ArrowDown className="h-4 w-4 mr-2" />Fazer Downgrade</>
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showPixModal && pixData && (
        <PixPaymentModal
          pix={pixData}
          organizationId={organizationId}
          onPaid={handlePixPaid}
          onClose={() => setShowPixModal(false)}
        />
      )}
    </>
  );
}
