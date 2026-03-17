"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  Users,
  TrendingUp,
  BarChart3,
  Trophy,
  Zap,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PLAN_ORDER,
  PLAN_NAMES,
  PLAN_PRICES_CENTS,
  PLAN_FEATURES,
  PLAN_ICONS,
  PLAN_COLORS,
  PLAN_LIMITS,
  PERIOD_NAMES,
  PERIOD_DISCOUNTS,
  PERIOD_LABELS,
  POPULAR_PLAN,
  formatBRL,
  type Period,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const PERIODS: Period[] = ["monthly", "quarterly", "yearly"];

const ALL_FEATURES = [
  { icon: Shield, title: "Dashboard Completo", desc: "Visão geral de todas as estatísticas" },
  { icon: BarChart3, title: "Analytics Avançado", desc: "Estatísticas detalhadas e métricas" },
  { icon: Trophy, title: "Rankings", desc: "Rankings de guerras e CWL" },
  { icon: Zap, title: "Guerra Atual", desc: "Acompanhe guerras em tempo real" },
  { icon: TrendingUp, title: "Previsões", desc: "Sistema de previsão inteligente" },
  { icon: Users, title: "Gestão de Membros", desc: "Gerencie membros e convites" },
];

const FAQS = [
  {
    q: "Posso mudar de plano depois?",
    a: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento pelo painel de assinatura.",
  },
  {
    q: "O que acontece após o trial de 3 dias?",
    a: "Após o trial, sua assinatura é cobrada automaticamente. Você pode cancelar antes disso sem custos.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, sem taxas ou multas. Você mantém acesso até o fim do período pago.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-sm hover:bg-muted/50 transition-colors"
      >
        {q}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 border-t">
          <p className="pt-3 text-sm text-muted-foreground">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("monthly");

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 max-w-7xl">

        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold">Escolha o plano perfeito para você</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Planos que{" "}
            <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              crescem
            </span>{" "}
            com você
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Comece com 3 dias grátis. Sem compromisso. Cancele quando quiser.
          </p>

          {/* Period toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl border bg-card p-1 gap-1 shadow-sm">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={cn(
                    "px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                    selectedPeriod === p
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {PERIOD_NAMES[p]}
                  {PERIOD_DISCOUNTS[p] && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] px-1.5"
                    >
                      {PERIOD_DISCOUNTS[p]}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PLAN_ORDER.map((plan) => {
            const Icon = PLAN_ICONS[plan];
            const colors = PLAN_COLORS[plan];
            const price = PLAN_PRICES_CENTS[plan][selectedPeriod];
            const limits = PLAN_LIMITS[plan];
            const features = PLAN_FEATURES[plan];
            const isPopular = plan === POPULAR_PLAN;
            const months = selectedPeriod === "monthly" ? 1 : selectedPeriod === "quarterly" ? 3 : 12;
            const monthlyEquiv = price.amount / months;

            return (
              <Card
                key={plan}
                className={cn(
                  "relative flex flex-col border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                  isPopular
                    ? "border-primary shadow-lg scale-[1.02] bg-linear-to-b from-primary/5 to-background"
                    : "border-border hover:border-primary/50"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-bold shadow">
                      MAIS POPULAR
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4 pt-8">
                  <div className="flex justify-center mb-3">
                    <div
                      className={cn(
                        "p-3 rounded-2xl bg-linear-to-br border-2",
                        colors.gradient,
                        colors.border
                      )}
                    >
                      <Icon className={cn("h-8 w-8", colors.icon)} />
                    </div>
                  </div>

                  <CardTitle className="text-2xl font-bold mb-1">{PLAN_NAMES[plan]}</CardTitle>

                  <p className="text-xs text-muted-foreground mb-3">
                    {limits.maxClans} {limits.maxClans === 1 ? "clã" : "clãs"} ·{" "}
                    {limits.maxInvites} {limits.maxInvites === 1 ? "convite" : "convites"}
                  </p>

                  {price.originalAmount && (
                    <p className="text-sm text-muted-foreground line-through mb-1">
                      {formatBRL(price.originalAmount)}
                    </p>
                  )}

                  <div className="mb-1">
                    <span className="text-3xl font-bold">{formatBRL(price.amount)}</span>
                    <span className="text-muted-foreground text-sm ml-1">
                      /{PERIOD_LABELS[selectedPeriod]}
                    </span>
                  </div>

                  {selectedPeriod !== "monthly" && (
                    <p className="text-xs text-muted-foreground">
                      {formatBRL(monthlyEquiv)}/mês equivalente
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    3 dias grátis · Cancele quando quiser
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-4 pt-0">
                  <Button
                    onClick={() =>
                      router.push(`/org/new?plan=${plan}&period=${selectedPeriod}`)
                    }
                    className="w-full font-semibold"
                    size="lg"
                    variant={isPopular ? "default" : "outline"}
                  >
                    Começar Agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="space-y-2.5 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Incluído:
                    </p>
                    {features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm">
                        <div className="p-0.5 rounded-full bg-green-500/10 mt-0.5 shrink-0">
                          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features included in all plans */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Recursos em todos os planos</h2>
            <p className="text-muted-foreground">Tudo que você precisa para gerenciar seus clãs</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_FEATURES.map(({ icon: FIcon, title, desc }) => (
              <div
                key={title}
                className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
                  <FIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Perguntas Frequentes</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <FaqItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
