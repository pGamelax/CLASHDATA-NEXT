"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Crown, Star, Zap, CheckCircle2, ArrowUp, ArrowDown, AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const planNames = {
  MESTRE: "Mestre",
  CAMPEAO: "Campeão",
  TITA: "Titã",
  LEGEND: "Legend",
};

const planPrices = {
  MESTRE: { monthly: 29.90, quarterly: 26.91, yearly: 23.92 },
  CAMPEAO: { monthly: 45.90, quarterly: 41.31, yearly: 36.72 },
  TITA: { monthly: 74.90, quarterly: 67.41, yearly: 59.92 },
  LEGEND: { monthly: 119.90, quarterly: 107.91, yearly: 95.92 },
};

const planLimits = {
  MESTRE: { clans: 1, invites: 1 },
  CAMPEAO: { clans: 2, invites: 2 },
  TITA: { clans: 3, invites: 3 },
  LEGEND: { clans: 5, invites: 5 },
};

const planIcons = {
  MESTRE: Shield,
  CAMPEAO: Crown,
  TITA: Star,
  LEGEND: Zap,
};

const planColors = {
  MESTRE: "from-blue-500 to-blue-600",
  CAMPEAO: "from-purple-500 to-purple-600",
  TITA: "from-orange-500 to-orange-600",
  LEGEND: "from-yellow-400 to-yellow-600",
};

type Plan = "MESTRE" | "CAMPEAO" | "TITA" | "LEGEND";
type Period = "monthly" | "quarterly" | "yearly";

interface PlanUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: Plan;
  currentPeriod: Period;
  organizationId: string;
  onSuccess?: () => void;
}

export function PlanUpgradeDialog({
  open,
  onOpenChange,
  currentPlan,
  currentPeriod,
  organizationId,
  onSuccess,
}: PlanUpgradeDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(currentPlan);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(currentPeriod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpgrade = getPlanLevel(selectedPlan) > getPlanLevel(currentPlan);
  const isDowngrade = getPlanLevel(selectedPlan) < getPlanLevel(currentPlan);
  const isSamePlan = selectedPlan === currentPlan && selectedPeriod === currentPeriod;

  function getPlanLevel(plan: Plan): number {
    const levels = { MESTRE: 1, CAMPEAO: 2, TITA: 3, LEGEND: 4 };
    return levels[plan];
  }

  async function handleUpgrade() {
    if (isSamePlan) {
      setError("Você já está neste plano");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/stripe/create-upgrade-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          organizationId,
          newPlan: selectedPlan,
          newPeriod: selectedPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao fazer upgrade");
      }

      const data = await response.json();

      if (data.url && data.url !== window.location.href) {
        // Redireciona para o checkout
        window.location.href = data.url;
      } else {
        // Se não há URL (valor 0), atualiza direto
        await handleDirectUpgrade();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upgrade");
      setLoading(false);
    }
  }

  async function handleDirectUpgrade() {
    try {
      const response = await fetch(`${API_URL}/stripe/change-subscription-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          organizationId,
          newPlan: selectedPlan,
          newPeriod: selectedPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao trocar plano");
      }

      onSuccess?.();
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao trocar plano");
      setLoading(false);
    }
  }

  const currentPrice = planPrices[currentPlan][currentPeriod];
  const newPrice = planPrices[selectedPlan][selectedPeriod];
  const priceDifference = newPrice - currentPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-3xl font-bold">Atualizar Plano</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Escolha um novo plano e período de pagamento. O valor será calculado proporcionalmente ao tempo restante.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="border-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Seleção de Período */}
          <div className="space-y-3">
            <Label className="text-lg font-bold">Período de Pagamento</Label>
            <RadioGroup value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as Period)}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "monthly", label: "Mensal", discount: null },
                  { value: "quarterly", label: "Trimestral", discount: "10% OFF" },
                  { value: "yearly", label: "Anual", discount: "20% OFF" },
                ].map((period) => (
                  <Label
                    key={period.value}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      selectedPeriod === period.value && "border-primary bg-primary/10 shadow-md"
                    )}
                  >
                    <RadioGroupItem value={period.value} className="mb-3" />
                    <span className="font-bold text-lg">{period.label}</span>
                    {period.discount && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {period.discount}
                      </Badge>
                    )}
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de Plano */}
          <div className="space-y-3">
            <Label className="text-lg font-bold">Escolha o Plano</Label>
            <div className="grid grid-cols-2 gap-4">
              {(["MESTRE", "CAMPEAO", "TITA", "LEGEND"] as Plan[]).map((plan) => {
                const Icon = planIcons[plan];
                const isSelected = selectedPlan === plan;
                const isCurrent = plan === currentPlan;
                const colorClass = planColors[plan];

                return (
                  <Card
                    key={plan}
                    className={cn(
                      "cursor-pointer transition-all border-2 relative overflow-hidden",
                      isSelected && "border-primary shadow-lg scale-105",
                      isCurrent && "bg-muted/50",
                      !isSelected && !isCurrent && "hover:border-primary/50 hover:shadow-md"
                    )}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {isSelected && (
                      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", colorClass)} />
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg bg-gradient-to-br",
                            isSelected ? colorClass : "bg-muted"
                          )}>
                            <Icon className={cn("h-5 w-5", isSelected ? "text-white" : "text-muted-foreground")} />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{planNames[plan]}</CardTitle>
                            <CardDescription className="text-sm font-semibold">
                              R$ {planPrices[plan][selectedPeriod].toFixed(2)}
                              <span className="text-xs font-normal text-muted-foreground">
                                /{selectedPeriod === "monthly" ? "mês" : selectedPeriod === "quarterly" ? "trimestre" : "ano"}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs">Plano Atual</Badge>
                          )}
                          {isSelected && !isCurrent && (
                            <Badge className={cn("text-xs bg-gradient-to-r", colorClass)}>
                              {isUpgrade ? (
                                <>
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Upgrade
                                </>
                              ) : (
                                <>
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  Downgrade
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Até {planLimits[plan].clans} Clans</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Até {planLimits[plan].invites} Convites</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Resumo */}
          {!isSamePlan && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Resumo da Alteração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Plano Atual</p>
                    <p className="font-bold text-lg">{planNames[currentPlan]}</p>
                    <p className="text-sm">R$ {currentPrice.toFixed(2)}/{currentPeriod === "monthly" ? "mês" : currentPeriod === "quarterly" ? "trimestre" : "ano"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Novo Plano</p>
                    <p className="font-bold text-lg">{planNames[selectedPlan]}</p>
                    <p className="text-sm">R$ {newPrice.toFixed(2)}/{selectedPeriod === "monthly" ? "mês" : selectedPeriod === "quarterly" ? "trimestre" : "ano"}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border-2">
                  <span className="font-semibold text-lg">Valor Proporcional:</span>
                  <span className={cn(
                    "text-2xl font-bold",
                    priceDifference > 0 ? "text-green-600" : priceDifference < 0 ? "text-blue-600" : "text-muted-foreground"
                  )}>
                    {priceDifference > 0 ? "+" : ""}R$ {Math.abs(priceDifference).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  💡 O valor será calculado proporcionalmente ao tempo restante do período atual
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="min-w-[100px]">
            Cancelar
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={loading || isSamePlan}
            className={cn(
              "min-w-[160px] font-semibold",
              isUpgrade && "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
              isDowngrade && "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {isUpgrade ? (
                  <>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Fazer Upgrade
                  </>
                ) : isDowngrade ? (
                  <>
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Fazer Downgrade
                  </>
                ) : (
                  "Confirmar Alteração"
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
