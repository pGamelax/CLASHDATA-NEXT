"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Shield,
  Users,
  Zap,
  Loader2,
  ArrowUpRight,
  QrCode,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlanUpgradeDialog } from "@/components/PlanUpgradeDialog";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import {
  createPixPayment,
  getPixStatus,
  getPlans,
  type Subscription,
  type PixPaymentData,
  type PlanConfig,
} from "@/lib/api";
import { formatBRL } from "@/lib/plans";
import { getPlanIcon, getPlanColors } from "@/lib/plan-presets";

interface Props {
  organization: { id: string; slug: string; name: string };
  subscription: Subscription;
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysUntil(dateString?: string): number | null {
  if (!dateString) return null;
  const ms = new Date(dateString).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function isExpiredOrCancelled(sub: Subscription): boolean {
  if (sub.status === "EXPIRED" || sub.status === "CANCELLED") return true;
  if (sub.status === "ACTIVE" && sub.currentPeriodEnd)
    return new Date(sub.currentPeriodEnd) < new Date();
  if (sub.status === "TRIAL" && sub.trialEndsAt)
    return new Date(sub.trialEndsAt) < new Date();
  return false;
}

function StatusBadge({ status }: { status: Subscription["status"] }) {
  const config = {
    TRIAL:     { label: "Trial",     className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    ACTIVE:    { label: "Ativa",     className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
    CANCELLED: { label: "Cancelada", className: "bg-destructive/10 text-destructive border-destructive/20" },
    EXPIRED:   { label: "Expirada",  className: "bg-destructive/10 text-destructive border-destructive/20" },
  }[status] ?? { label: status, className: "" };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
}

function UsageBar({
  label, description, current, max, canAdd, icon: Icon, onUpgrade,
}: {
  label: string; description: string; current: number; max: number;
  canAdd: boolean; icon: React.ElementType; onUpgrade: () => void;
}) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const color = pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-base">{current}</span>
          <span className="text-muted-foreground">/ {max}</span>
          {canAdd ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{pct.toFixed(0)}% utilizado</span>
        {!canAdd && (
          <button onClick={onUpgrade} className="text-primary font-semibold hover:underline flex items-center gap-0.5">
            Fazer upgrade
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function SubscriptionContent({ organization, subscription }: Props) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<PlanConfig | null>(null);

  useEffect(() => {
    getPlans().then((plans) => {
      setPlanData(plans.find((p) => p.key === subscription.plan) ?? null);
    });
  }, [subscription.plan]);

  const planKey = subscription.plan;
  const expired = isExpiredOrCancelled(subscription);
  const isManual = subscription.paymentProvider === "manual";
  const Icon = getPlanIcon(planData?.icon ?? planKey);
  const colors = getPlanColors(planData?.color ?? "blue");

  // Alertas de vencimento
  const daysUntilTrialEnd = subscription.status === "TRIAL" ? daysUntil(subscription.trialEndsAt) : null;
  const daysUntilPeriodEnd = subscription.status === "ACTIVE" ? daysUntil(subscription.currentPeriodEnd) : null;
  const showTrialAlert = daysUntilTrialEnd !== null && daysUntilTrialEnd <= 1 && daysUntilTrialEnd >= 0;
  const showExpiryAlert = daysUntilPeriodEnd !== null && daysUntilPeriodEnd <= 7 && daysUntilPeriodEnd >= 0;

  async function handleOpenPix() {
    setLoadingPix(true);
    setError(null);
    try {
      // Tenta buscar PIX pendente existente
      const statusResult = await getPixStatus(organization.id);
      if (statusResult.pix && statusResult.pix.status === "PENDING") {
        setPixData(statusResult.pix);
        setShowPixModal(true);
        return;
      }

      // Gera novo PIX
      const result = await createPixPayment({
        organizationId: organization.id,
        plan: subscription.plan,
        period: subscription.period ?? "monthly",
      });
      setPixData(result.pix);
      setShowPixModal(true);
    } catch (err: any) {
      setError(err.message ?? "Erro ao gerar PIX");
    } finally {
      setLoadingPix(false);
    }
  }

  function handlePixPaid() {
    setShowPixModal(false);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seu plano e recursos de {organization.name}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Alertas de vencimento */}
      {showTrialAlert && !expired && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
          <Bell className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {daysUntilTrialEnd === 0
                ? "Seu trial expira hoje!"
                : "Seu trial expira amanhã!"}
            </p>
            <p className="mt-0.5">
              Pague via PIX para continuar usando a plataforma sem interrupção.
            </p>
          </div>
        </div>
      )}

      {showExpiryAlert && !expired && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
          <Bell className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {daysUntilPeriodEnd === 0
                ? "Sua assinatura expira hoje!"
                : `Sua assinatura expira em ${daysUntilPeriodEnd} ${daysUntilPeriodEnd === 1 ? "dia" : "dias"}!`}
            </p>
            <p className="mt-0.5">
              Renove via PIX para não perder o acesso.
            </p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Plan card */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-linear-to-br ${colors.gradient} border ${colors.border}`}>
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <div>
                  <CardTitle className="text-xl">{planData?.name ?? planKey}</CardTitle>
                  <CardDescription className="font-medium">
                    {planData ? `${formatBRL(planData.monthlyPrice)}/mês` : ""}
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status={subscription.status} />
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {/* Date info */}
            {subscription.status === "TRIAL" && subscription.trialEndsAt && (
              <div className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm ${
                expired
                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
              }`}>
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {expired ? "Trial expirou em" : "Trial termina em"}{" "}
                  <strong>{formatDate(subscription.trialEndsAt)}</strong>
                </span>
              </div>
            )}

            {subscription.status === "ACTIVE" && subscription.currentPeriodEnd && (
              <div className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm ${
                expired
                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : "border-border bg-muted/50 text-muted-foreground"
              }`}>
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {expired ? "Expirou em" : "Próximo pagamento em"}{" "}
                  <strong className="text-foreground">{formatDate(subscription.currentPeriodEnd)}</strong>
                </span>
              </div>
            )}

            {expired && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Assinatura {subscription.status === "CANCELLED" ? "cancelada" : "expirada"}.</strong>{" "}
                  Renove via PIX para continuar.
                </span>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 py-1">
              {[
                { icon: Shield, label: `Até ${subscription.limits.maxClans} ${subscription.limits.maxClans === 1 ? "Clã" : "Clãs"}` },
                { icon: Users, label: `Até ${subscription.limits.maxInvites} ${subscription.limits.maxInvites === 1 ? "Convite" : "Convites"}` },
                { icon: CheckCircle2, label: "Dashboard Completo" },
                { icon: CheckCircle2, label: "Suporte Dedicado" },
              ].map(({ icon: FeatureIcon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <div className="p-1 rounded-md bg-green-500/10 shrink-0">
                    <FeatureIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <Button onClick={handleOpenPix} disabled={loadingPix} className="w-full">
                {loadingPix ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                {loadingPix
                  ? "Gerando PIX..."
                  : expired
                  ? "Renovar via PIX"
                  : "Pagar / Renovar via PIX"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUpgradeDialog(true)}
                disabled={loadingPix}
                className="w-full"
              >
                {expired ? (
                  <><ArrowUpRight className="h-4 w-4 mr-2" />Escolher Novo Plano</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" />Trocar Plano</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <CardTitle className="text-base">Uso do Plano</CardTitle>
                <CardDescription>Recursos utilizados no período atual</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <UsageBar
              label="Clãs"
              description="Clãs cadastrados na organização"
              current={subscription.usage.clans.current}
              max={subscription.usage.clans.max}
              canAdd={subscription.usage.clans.canAdd}
              icon={Shield}
              onUpgrade={() => setShowUpgradeDialog(true)}
            />
            <UsageBar
              label="Convites"
              description="Membros convidados para a organização"
              current={subscription.usage.invites.current}
              max={subscription.usage.invites.max}
              canAdd={subscription.usage.invites.canAdd}
              icon={Users}
              onUpgrade={() => setShowUpgradeDialog(true)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <PlanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentPlan={planKey}
        organizationId={organization.id}
        onSuccess={() => window.location.reload()}
      />

      {showPixModal && pixData && (
        <PixPaymentModal
          pix={pixData}
          organizationId={organization.id}
          onPaid={handlePixPaid}
          onClose={() => setShowPixModal(false)}
        />
      )}
    </div>
  );
}
