"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, Calendar, AlertCircle, CheckCircle2, XCircle, TrendingUp, Users, Shield, Sparkles, Zap, Crown, Star } from "lucide-react";
import { PlanUpgradeDialog } from "@/components/PlanUpgradeDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface Subscription {
  id: string;
  plan: "MESTRE" | "CAMPEAO" | "TITA";
  status: "TRIAL" | "ACTIVE" | "CANCELLED" | "EXPIRED";
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
  stripeCustomerId?: string | null;
  limits: {
    maxClans: number;
    maxInvites: number;
  };
  usage: {
    clans: {
      current: number;
      max: number;
      canAdd: boolean;
    };
    invites: {
      current: number;
      max: number;
      canAdd: boolean;
    };
  };
}

interface SubscriptionContentProps {
  organization: {
    id: string;
    slug: string;
    name: string;
  };
}

const planNames = {
  MESTRE: "Mestre",
  CAMPEAO: "Campeão",
  TITA: "Titã",
};

const planPrices = {
  MESTRE: "R$ 29,90",
  CAMPEAO: "R$ 45,90",
  TITA: "R$ 74,90",
};

export function SubscriptionContent({ organization }: SubscriptionContentProps) {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, [organization.id]);

  async function loadSubscription() {
    try {
      setLoading(true);
      const subResponse = await fetch(
        `${API_URL}/subscriptions/organization/${organization.id}`,
        {
          credentials: "include",
        }
      );

      if (!subResponse.ok) {
        throw new Error("Subscription não encontrada");
      }

      const subData = await subResponse.json();
      setSubscription(subData.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar subscription");
    } finally {
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    if (!subscription) return;

    try {
      setOpeningPortal(true);
      const response = await fetch(`${API_URL}/stripe/create-portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          organizationId: organization.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar portal");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir portal");
      setOpeningPortal(false);
    }
  }

  async function handleRenewSubscription() {
    if (!subscription) return;

    try {
      setRenewing(true);
      setError(null);
      
      // Redireciona para a página de pricing para renovar
      window.location.href = `/pricing?org=${organization.slug}&renew=true`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao renovar assinatura");
      setRenewing(false);
    }
  }

  async function handleChangePlan() {
    if (!subscription) return;

    // Se não tem stripeCustomerId, não pode trocar de plano (é manual)
    if (!subscription.stripeCustomerId) {
      setError("Assinaturas manuais não podem ser alteradas pelo portal. Entre em contato com o administrador.");
      return;
    }

    // Abre o diálogo de upgrade
    setShowUpgradeDialog(true);
  }

  const isExpired = subscription?.status === "EXPIRED" || 
    subscription?.status === "CANCELLED" ||
    (subscription?.status === "ACTIVE" && subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()) ||
    (subscription?.status === "TRIAL" && subscription?.trialEndsAt && new Date(subscription.trialEndsAt) < new Date());
  
  const isCancelled = subscription?.status === "CANCELLED";

  function formatDate(dateString?: string) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "TRIAL":
        return <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <Sparkles className="h-3 w-3" />
          Trial
        </Badge>;
      case "ACTIVE":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1.5 px-3 py-1">
          <CheckCircle2 className="h-3 w-3" />
          Ativa
        </Badge>;
      case "CANCELLED":
        return <Badge variant="destructive" className="gap-1.5 px-3 py-1">
          <XCircle className="h-3 w-3" />
          Cancelada
        </Badge>;
      case "EXPIRED":
        return <Badge variant="destructive" className="gap-1.5 px-3 py-1">
          <AlertCircle className="h-3 w-3" />
          Expirada
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  function getPlanIcon(plan: string) {
    switch (plan) {
      case "MESTRE":
        return <Shield className="h-6 w-6 text-primary" />;
      case "CAMPEAO":
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case "TITA":
        return <Star className="h-6 w-6 text-purple-500" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Subscription não encontrada"}</AlertDescription>
      </Alert>
    );
  }

  const usagePercentage = {
    clans: (subscription.usage.clans.current / subscription.usage.clans.max) * 100,
    invites: (subscription.usage.invites.current / subscription.usage.invites.max) * 100,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assinatura</h1>
        <p className="text-muted-foreground mt-1.5">
          Gerencie sua assinatura, plano e recursos
        </p>
      </div>

      {/* Status da Subscription */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {getPlanIcon(subscription.plan)}
                <div>
                  <CardTitle className="text-2xl font-bold">{planNames[subscription.plan]}</CardTitle>
                  <CardDescription className="text-base mt-0.5 font-medium">
                    {planPrices[subscription.plan]}/mês
                  </CardDescription>
                </div>
              </div>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.status === "TRIAL" && subscription.trialEndsAt && (
            <Alert className={isExpired ? "border-red-200 bg-red-50 dark:bg-red-950/20" : "border-blue-200 bg-blue-50 dark:bg-blue-950/20"}>
              <Calendar className={`h-4 w-4 ${isExpired ? "text-red-600" : "text-blue-600"}`} />
              <AlertDescription className={isExpired ? "text-red-900 dark:text-red-100" : "text-blue-900 dark:text-blue-100"}>
                {isExpired ? (
                  <>
                    <strong>Trial Expirado</strong> - Expirou em: <strong>{formatDate(subscription.trialEndsAt)}</strong>
                  </>
                ) : (
                  <>
                    <strong>Período de Trial Ativo</strong> - Termina em: <strong>{formatDate(subscription.trialEndsAt)}</strong>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {subscription.status === "ACTIVE" && subscription.currentPeriodEnd && (
            <div className={`flex items-center gap-2.5 p-3 rounded-lg ${isExpired ? "bg-red-50 dark:bg-red-950/20 border border-red-200" : "bg-muted/50"}`}>
              <Calendar className={`h-4 w-4 flex-shrink-0 ${isExpired ? "text-red-600" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isExpired ? "text-red-900 dark:text-red-100" : ""}`}>
                  {isExpired ? "Assinatura Expirada" : "Próxima cobrança"}
                </p>
                <p className={`text-sm ${isExpired ? "text-red-700 dark:text-red-200" : "text-muted-foreground"}`}>
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          )}

          {(isExpired || isCancelled) && (
            <Alert variant="destructive" className="border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sua assinatura {isCancelled ? "foi cancelada" : "expirou"}.</strong> Renove ou troque de plano para continuar usando a plataforma.
              </AlertDescription>
            </Alert>
          )}

          {subscription.cancelAtPeriodEnd && (
            <Alert variant="destructive" className="border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sua assinatura será cancelada ao final do período atual em <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="flex flex-col gap-3">
            {(isExpired || isCancelled) ? (
              <>
                {/* Se tem stripeCustomerId, mostra botão para abrir portal Stripe */}
                {subscription.stripeCustomerId ? (
                  <>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={openingPortal}
                      className="w-full"
                      size="lg"
                      variant="default"
                    >
                      {openingPortal ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Abrindo portal...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Abrir Portal Stripe para Pagar
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleChangePlan}
                      disabled={changingPlan || openingPortal}
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      {changingPlan || openingPortal ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Abrindo portal...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Trocar de Assinatura
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleRenewSubscription}
                      disabled={renewing}
                      className="w-full"
                      size="lg"
                      variant="default"
                    >
                      {renewing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecionando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Renovar Assinatura
                        </>
                      )}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Só mostra botões do Stripe se tiver stripeCustomerId (não é manual) */}
                {subscription.stripeCustomerId ? (
                  <>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={openingPortal}
                      className="w-full"
                      size="lg"
                      variant="default"
                    >
                      {openingPortal ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Abrindo portal...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Gerenciar Assinatura no Stripe
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleChangePlan}
                      disabled={changingPlan || openingPortal}
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      {changingPlan || openingPortal ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Abrindo portal...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Trocar de Assinatura
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esta é uma assinatura manual. Entre em contato com o administrador para alterações.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Limites e Uso */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Uso do Plano</CardTitle>
              <CardDescription>
                Acompanhe o uso dos recursos do seu plano
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clans */}
          <div className="space-y-3 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Clans</p>
                  <p className="text-xs text-muted-foreground">Clans cadastrados na organização</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{subscription.usage.clans.current}</span>
                <span className="text-sm text-muted-foreground">/ {subscription.usage.clans.max}</span>
                {subscription.usage.clans.canAdd ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
            </div>
            <Progress 
              value={usagePercentage.clans} 
              className="h-2.5"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {usagePercentage.clans.toFixed(0)}% utilizado
              </span>
              {!subscription.usage.clans.canAdd && (
                <span className="text-destructive font-medium">
                  Limite atingido
                </span>
              )}
            </div>
            {!subscription.usage.clans.canAdd && (
              <p className="text-xs text-destructive mt-1">
                Faça upgrade para adicionar mais clans à sua organização.
              </p>
            )}
          </div>

          {/* Convites */}
          <div className="space-y-3 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Convites</p>
                  <p className="text-xs text-muted-foreground">Membros convidados para a organização</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{subscription.usage.invites.current}</span>
                <span className="text-sm text-muted-foreground">/ {subscription.usage.invites.max}</span>
                {subscription.usage.invites.canAdd ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
            </div>
            <Progress 
              value={usagePercentage.invites} 
              className="h-2.5"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {usagePercentage.invites.toFixed(0)}% utilizado
              </span>
              {!subscription.usage.invites.canAdd && (
                <span className="text-destructive font-medium">
                  Limite atingido
                </span>
              )}
            </div>
            {!subscription.usage.invites.canAdd && (
              <p className="text-xs text-destructive mt-1">
                Faça upgrade para convidar mais membros para sua organização.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recursos do Plano */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Recursos Incluídos</CardTitle>
              <CardDescription>
                O que está incluído no plano {planNames[subscription.plan]}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Até {subscription.limits.maxClans} Clans</p>
                <p className="text-xs text-muted-foreground mt-0.5">Gerencie múltiplos clans em uma organização</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Até {subscription.limits.maxInvites} Convites</p>
                <p className="text-xs text-muted-foreground mt-0.5">Convide membros para sua organização</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Dashboard Completo</p>
                <p className="text-xs text-muted-foreground mt-0.5">Acesse todas as funcionalidades de análise</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/20">
                <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Suporte Prioritário</p>
                <p className="text-xs text-muted-foreground mt-0.5">Atendimento rápido e dedicado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Upgrade */}
      {subscription && subscription.stripeCustomerId && (
        <PlanUpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          currentPlan={subscription.plan}
          currentPeriod="monthly" // Por padrão, assumimos monthly. O Stripe pode ter período diferente, mas isso será tratado no backend
          organizationId={organization.id}
          onSuccess={() => {
            loadSubscription();
            setShowUpgradeDialog(false);
          }}
        />
      )}
    </div>
  );
}
