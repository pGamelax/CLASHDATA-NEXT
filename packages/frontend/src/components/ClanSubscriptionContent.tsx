"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Clock, XCircle, AlertCircle, ArrowUp } from "lucide-react";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { PlanUpgradeDialog } from "@/components/PlanUpgradeDialog";
import { formatBRL } from "@/lib/plans";
import type { Subscription, PixPaymentData, PlanConfig } from "@/lib/api";

interface Props {
  clan: { id: string; name: string; tag: string };
  subscription: Subscription | null;
  pendingPix: PixPaymentData | null;
  plans: PlanConfig[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "Ativo", variant: "default" },
    TRIAL: { label: "Trial", variant: "secondary" },
    EXPIRED: { label: "Expirado", variant: "destructive" },
    CANCELLED: { label: "Cancelado", variant: "outline" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function ClanSubscriptionContent({ clan, subscription, pendingPix, plans }: Props) {
  const router = useRouter();
  const [showPix, setShowPix] = useState(!!pendingPix);
  const [currentPix, setCurrentPix] = useState<PixPaymentData | null>(pendingPix);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handlePaid = () => {
    setShowPix(false);
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie a assinatura de <span className="font-medium text-foreground">{clan.name}</span>
        </p>
      </div>

      {/* Current subscription */}
      <Card>
        <CardHeader className="flex-row items-center gap-3 pb-3">
          <CreditCard className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <CardTitle className="text-base">Plano atual</CardTitle>
            <CardDescription>Detalhes da sua assinatura</CardDescription>
          </div>
          {subscription && <StatusBadge status={subscription.status} />}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {subscription ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano</span>
                <span className="font-medium">{subscription.plan}</span>
              </div>
              {subscription.period && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período</span>
                  <span className="font-medium capitalize">{subscription.period}</span>
                </div>
              )}
              {subscription.trialEndsAt && subscription.status === "TRIAL" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial até</span>
                  <span className="font-medium">
                    {new Date(subscription.trialEndsAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              {subscription.currentPeriodEnd && subscription.status !== "TRIAL" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Válido até</span>
                  <span className="font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              {subscription.pendingPlan && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    Downgrade para <strong>{subscription.pendingPlan}</strong> agendado para o próximo ciclo
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Nenhuma assinatura ativa</p>
          )}
        </CardContent>
      </Card>

      {/* Pending PIX */}
      {currentPix && showPix && (
        <PixPaymentModal
          pix={currentPix}
          clanId={clan.id}
          onPaid={handlePaid}
          onClose={() => setShowPix(false)}
        />
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIAL") && (
          <Button onClick={() => setUpgradeOpen(true)} className="gap-2">
            <ArrowUp className="h-4 w-4" />
            Alterar plano
          </Button>
        )}
        {!subscription || (subscription.status !== "ACTIVE" && subscription.status !== "TRIAL") ? (
          <Button onClick={() => setUpgradeOpen(true)}>
            Assinar agora
          </Button>
        ) : null}
        {currentPix && !showPix && (
          <Button variant="outline" onClick={() => setShowPix(true)}>
            Ver pagamento pendente
          </Button>
        )}
      </div>

      {upgradeOpen && subscription && (
        <PlanUpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          currentPlan={subscription.plan}
          currentPeriodEnd={subscription.currentPeriodEnd}
          currentPeriod={subscription.period}
          clanId={clan.id}
          onSuccess={() => { setUpgradeOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
