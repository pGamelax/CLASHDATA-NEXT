"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Crown, Star, Zap, CheckCircle2, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Trocar de Plano</DialogTitle>
          <DialogDescription>
            Escolha um novo plano e período de pagamento. O valor será calculado proporcionalmente.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Seleção de Período */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Período de Pagamento</Label>
            <RadioGroup value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as Period)}>
              <div className="grid grid-cols-3 gap-4">
                <Label className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="monthly" className="mb-2" />
                  <span className="font-semibold">Mensal</span>
                  <span className="text-sm text-muted-foreground">Sem desconto</span>
                </Label>
                <Label className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="quarterly" className="mb-2" />
                  <span className="font-semibold">Trimestral</span>
                  <Badge variant="secondary" className="mt-1">10% OFF</Badge>
                </Label>
                <Label className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="yearly" className="mb-2" />
                  <span className="font-semibold">Anual</span>
                  <Badge variant="secondary" className="mt-1">20% OFF</Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de Plano */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Escolha o Plano</Label>
            <div className="grid grid-cols-2 gap-4">
              {(["MESTRE", "CAMPEAO", "TITA", "LEGEND"] as Plan[]).map((plan) => {
                const Icon = planIcons[plan];
                const isSelected = selectedPlan === plan;
                const isCurrent = plan === currentPlan;

                return (
                  <Card
                    key={plan}
                    className={`cursor-pointer transition-all ${
                      isSelected ? "border-primary border-2 shadow-md" : "border"
                    } ${isCurrent ? "bg-muted/30" : ""}`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{planNames[plan]}</CardTitle>
                        </div>
                        {isCurrent && (
                          <Badge variant="outline">Plano Atual</Badge>
                        )}
                        {isSelected && !isCurrent && (
                          <Badge variant="default">
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
                      <CardDescription>
                        R$ {planPrices[plan][selectedPeriod].toFixed(2)}/{selectedPeriod === "monthly" ? "mês" : selectedPeriod === "quarterly" ? "trimestre" : "ano"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Até {planLimits[plan].clans} Clans</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
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
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Alteração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Plano Atual:</span>
                  <span className="font-semibold">{planNames[currentPlan]} - R$ {currentPrice.toFixed(2)}/{currentPeriod === "monthly" ? "mês" : currentPeriod === "quarterly" ? "trimestre" : "ano"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Novo Plano:</span>
                  <span className="font-semibold">{planNames[selectedPlan]} - R$ {newPrice.toFixed(2)}/{selectedPeriod === "monthly" ? "mês" : selectedPeriod === "quarterly" ? "trimestre" : "ano"}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Diferença Proporcional:</span>
                  <span className={priceDifference > 0 ? "text-green-600" : "text-blue-600"}>
                    {priceDifference > 0 ? "+" : ""}R$ {priceDifference.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  O valor será calculado proporcionalmente ao tempo restante do período atual.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={loading || isSamePlan}
            className="min-w-[120px]"
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
