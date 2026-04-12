"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, Sparkles, AlertCircle, QrCode, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatBRL } from "@/lib/plans";
import { getPlanIcon, getPlanColors } from "@/lib/plan-presets";
import { cn } from "@/lib/utils";
import {
  checkTrialStatus, createClanWithTrial, getPlans,
  type PixPaymentData, type PlanConfig,
} from "@/lib/api";
import { PixPaymentModal } from "@/components/PixPaymentModal";

const schema = z.object({
  clanTag: z.string().min(1, "Tag do clan é obrigatória").max(15, "Tag muito longa"),
});
type FormData = z.infer<typeof schema>;

type Period = "monthly" | "quarterly" | "yearly";

const PERIOD_NAMES: Record<Period, string> = { monthly: "Mensal", quarterly: "Trimestral", yearly: "Anual" };
const PERIOD_LABELS: Record<Period, string> = { monthly: "mês", quarterly: "trimestre", yearly: "ano" };
const PERIOD_MONTHS: Record<Period, number> = { monthly: 1, quarterly: 3, yearly: 12 };

function getPlanPrice(plan: PlanConfig, period: Period) {
  if (period === "monthly")   return { amount: plan.monthlyPrice, originalAmount: null };
  if (period === "quarterly") return { amount: plan.quarterlyPrice, originalAmount: plan.originalQuarterlyPrice };
  return                             { amount: plan.yearlyPrice,   originalAmount: plan.originalYearlyPrice };
}

interface Props { planKey: string; period: Period; }

export function NewClanContent({ planKey, period }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdClan, setCreatedClan] = useState<{ id: string; tag: string; name: string } | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);

  const [planData, setPlanData] = useState<PlanConfig | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([getPlans(), checkTrialStatus()]).then(([plans, trial]) => {
      const found = plans.find((p) => p.key === planKey) ?? null;
      setPlanData(found);
      setHasUsedTrial(trial.hasUsedTrial);
      setLoadingPlan(false);
    });
  }, [planKey]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit({ clanTag }: FormData) {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createClanWithTrial({ clanTag, plan: planKey, period });
      setCreatedClan(result.clan);
      if (result.hasUsedTrial) {
        if (result.pix) {
          setPixData(result.pix);
        } else {
          setError("Não foi possível gerar o PIX. Tente novamente.");
        }
      } else {
        const tagSlug = result.clan.tag.replace("#", "").toLowerCase();
        router.push(`/clan/${tagSlug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar clan");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePixPaid() {
    if (createdClan) {
      const tagSlug = createdClan.tag.replace("#", "").toLowerCase();
      router.push(`/clan/${tagSlug}`);
    }
  }

  const loading = loadingPlan || hasUsedTrial === null;
  const noTrial = hasUsedTrial === true;

  if (pixData && createdClan) {
    return (
      <PixPaymentModal
        pix={pixData}
        clanId={createdClan.id}
        onPaid={handlePixPaid}
      />
    );
  }

  const Icon = planData ? getPlanIcon(planData.icon) : null;
  const colors = planData ? getPlanColors(planData.color) : null;
  const price = planData ? getPlanPrice(planData, period) : null;
  const monthlyEquiv = price ? price.amount / PERIOD_MONTHS[period] : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Planos
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Adicionar Clan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {noTrial
              ? "Informe a tag do seu clan e pague via PIX para ativar."
              : "Seu clan será adicionado com 3 dias de trial gratuito."}
          </p>
        </div>

        <div className="space-y-4">
          {noTrial && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Trial já utilizado</p>
                <p className="mt-0.5">Você já usou seu período de trial. O pagamento via PIX é necessário para ativar este clan.</p>
              </div>
            </div>
          )}

          {/* Plan summary */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              {loading || !planData || !Icon || !colors || !price ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Carregando plano...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl bg-linear-to-br border-2", colors.gradient, colors.border)}>
                      <Icon className={cn("h-5 w-5", colors.icon)} />
                    </div>
                    <div>
                      <CardTitle className="text-base">Plano {planData.name}</CardTitle>
                      <CardDescription>{PERIOD_NAMES[period]}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {price.originalAmount && (
                      <p className="text-xs text-muted-foreground line-through">{formatBRL(price.originalAmount)}</p>
                    )}
                    <p className="font-bold text-base">{formatBRL(price.amount)}</p>
                    <p className="text-xs text-muted-foreground">/{PERIOD_LABELS[period]}</p>
                  </div>
                </div>
              )}
            </CardHeader>
            {planData && price && (
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                  {period !== "monthly" && (
                    <span className="text-xs">{formatBRL(monthlyEquiv)}/mês equivalente</span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  {noTrial ? (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0">Pagamento obrigatório</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-0">3 dias grátis</Badge>
                  )}
                  <span>{noTrial ? "Pague via PIX para ativar" : "Trial ativado ao criar"}</span>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tag do Clan</CardTitle>
                <CardDescription>Informe a tag do seu clan no Clash of Clans (sem o #)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clan-tag">Tag do Clan</Label>
                  <Input
                    id="clan-tag"
                    {...register("clanTag")}
                    placeholder="ABC123"
                    disabled={isSubmitting || loading}
                    className="h-11 font-mono uppercase"
                    autoFocus
                  />
                  {errors.clanTag && <p className="text-sm text-destructive">{errors.clanTag.message}</p>}
                  <p className="text-xs text-muted-foreground">Encontre a tag do seu clan nas configurações do clan no Clash of Clans</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting || loading} className="w-full h-11" size="lg">
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adicionando...</>
                  ) : loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verificando...</>
                  ) : noTrial ? (
                    <><QrCode className="h-4 w-4 mr-2" />Adicionar e Pagar via PIX</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Adicionar e Começar Trial</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
