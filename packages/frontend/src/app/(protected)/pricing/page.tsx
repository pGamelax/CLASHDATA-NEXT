"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL, type Period } from "@/lib/plans";
import { getPlanIcon, getPlanColors } from "@/lib/plan-presets";
import { cn } from "@/lib/utils";
import { getPlans, type PlanConfig } from "@/lib/api";

type PeriodKey = "monthly" | "quarterly" | "yearly";

const PERIODS: { key: PeriodKey; label: string; discount: string | null }[] = [
  { key: "monthly",   label: "Mensal",      discount: null      },
  { key: "quarterly", label: "Trimestral",  discount: "10% OFF" },
  { key: "yearly",    label: "Anual",       discount: "20% OFF" },
];

const PERIOD_UNIT: Record<PeriodKey, string> = {
  monthly: "mês",
  quarterly: "trimestre",
  yearly: "ano",
};

const PERIOD_MONTHS: Record<PeriodKey, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

function getPlanPrice(plan: PlanConfig, period: PeriodKey) {
  if (period === "monthly")   return { amount: plan.monthlyPrice,   original: null };
  if (period === "quarterly") return { amount: plan.quarterlyPrice, original: plan.originalQuarterlyPrice };
  return                             { amount: plan.yearlyPrice,    original: plan.originalYearlyPrice };
}

const ALL_FEATURES = [
  { icon: Shield,    title: "Dashboard Completo", desc: "Visão geral de todas as estatísticas" },
  { icon: BarChart3, title: "Analytics Avançado",  desc: "Estatísticas detalhadas e métricas"  },
  { icon: Trophy,    title: "Rankings",            desc: "Rankings de guerras e CWL"           },
  { icon: Zap,       title: "Guerra Atual",        desc: "Acompanhe guerras em tempo real"     },
  { icon: TrendingUp,title: "Previsões",           desc: "Sistema de previsão inteligente"     },
  { icon: Users,     title: "Gestão de Membros",   desc: "Gerencie membros e convites"         },
];

const FAQS = [
  { q: "Posso mudar de plano depois?",           a: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento pelo painel de assinatura." },
  { q: "O que acontece após o trial de 3 dias?", a: "Após o trial, sua assinatura é cobrada via PIX. Você pode pagar quando quiser." },
  { q: "Posso cancelar a qualquer momento?",     a: "Sim, sem taxas ou multas. Você mantém acesso até o fim do período pago." },
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
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")} />
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
  const [period, setPeriod] = useState<PeriodKey>("monthly");
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPlans().then((p) => {
      setPlans(p);
      setLoading(false);
    });
  }, []);

  const scrollToIdx = useCallback((idx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[idx] as HTMLElement;
    if (card) {
      const left =
        card.getBoundingClientRect().left -
        container.getBoundingClientRect().left +
        container.scrollLeft;
      container.scrollTo({ left, behavior: "smooth" });
    }
    setCurrent(idx);
  }, []);

  const prev = () => scrollToIdx(Math.max(0, current - 1));
  const next = () => scrollToIdx(Math.min(plans.length - 1, current + 1));

  function handleScroll() {
    const container = scrollRef.current;
    if (!container || !container.children.length) return;
    const containerLeft = container.getBoundingClientRect().left;
    let closestIdx = 0;
    let closestDist = Infinity;
    Array.from(container.children).forEach((child, idx) => {
      const dist = Math.abs((child as HTMLElement).getBoundingClientRect().left - containerLeft);
      if (dist < closestDist) { closestDist = dist; closestIdx = idx; }
    });
    setCurrent(closestIdx);
  }

  return (
    <div className="min-h-screen bg-background">
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
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    "px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                    period === p.key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                  {p.discount && (
                    <Badge variant="secondary" className="ml-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] px-1.5">
                      {p.discount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plan carousel */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mb-16 relative">
            {/* Scroll track */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-5 overflow-x-auto scroll-smooth pt-5 pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {plans.map((plan) => {
                const Icon = getPlanIcon(plan.icon);
                const colors = getPlanColors(plan.color);
                const price = getPlanPrice(plan, period);
                const monthlyEquiv = price.amount / PERIOD_MONTHS[period];

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col border-2 transition-all duration-300 shrink-0 snap-start",
                      "w-[85vw] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-[calc(25%-15px)]",
                      plan.isPopular
                        ? "border-primary shadow-lg bg-linear-to-b from-primary/5 to-background"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-bold shadow">
                          MAIS POPULAR
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4 pt-8">
                      <div className="flex justify-center mb-3">
                        <div className={cn("p-3 rounded-2xl bg-linear-to-br border-2", colors.gradient, colors.border)}>
                          <Icon className={cn("h-8 w-8", colors.icon)} />
                        </div>
                      </div>

                      <CardTitle className="text-2xl font-bold mb-1">{plan.name}</CardTitle>

                      {plan.description && (
                        <p className="text-xs text-muted-foreground mb-1">{plan.description}</p>
                      )}

                      <p className="text-xs text-muted-foreground mb-3">
                        {plan.maxClans} {plan.maxClans === 1 ? "clã" : "clãs"} ·{" "}
                        {plan.maxInvites} {plan.maxInvites === 1 ? "convite" : "convites"}
                      </p>

                      {price.original && (
                        <p className="text-sm text-muted-foreground line-through mb-1">
                          {formatBRL(price.original)}
                        </p>
                      )}

                      <div className="mb-1">
                        <span className="text-3xl font-bold">{formatBRL(price.amount)}</span>
                        <span className="text-muted-foreground text-sm ml-1">/{PERIOD_UNIT[period]}</span>
                      </div>

                      {period !== "monthly" && (
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
                        onClick={() => router.push(`/org/new?plan=${plan.key}&period=${period}`)}
                        className="w-full font-semibold"
                        size="lg"
                        variant={plan.isPopular ? "default" : "outline"}
                      >
                        Começar Agora
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      {plan.features.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Incluído:</p>
                          {plan.features.map((feature) => (
                            <div key={feature} className="flex items-start gap-2 text-sm">
                              <div className="p-0.5 rounded-full bg-green-500/10 mt-0.5 shrink-0">
                                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              </div>
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Prev / Next arrows — only show when there are more cards than fit */}
            {plans.length > 1 && (
              <>
                <button
                  onClick={prev}
                  disabled={current === 0}
                  className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  disabled={current === plans.length - 1}
                  className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Dots */}
            {plans.length > 1 && (
              <div className="flex justify-center gap-2 mt-2">
                {plans.map((plan, idx) => (
                  <button
                    key={plan.id}
                    onClick={() => scrollToIdx(idx)}
                    aria-label={plan.name}
                    className={cn(
                      "rounded-full transition-all duration-300 h-2",
                      idx === current
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/60 w-2"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Features included in all plans */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Recursos em todos os planos</h2>
            <p className="text-muted-foreground">Tudo que você precisa para gerenciar seus clãs</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_FEATURES.map(({ icon: FIcon, title, desc }) => (
              <div key={title} className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors">
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
            {FAQS.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>

      </div>
    </div>
  );
}
