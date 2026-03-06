"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Crown,
  Trophy,
  Zap,
  Sparkles,
  ArrowRight,
  Shield,
  Users,
  TrendingUp,
  BarChart3,
  Wine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/auth";

type PaymentPeriod = "monthly" | "quarterly" | "yearly";

// Preços dos planos
const PLAN_PRICES = {
  MESTRE: {
    monthly: { amount: 2990, originalAmount: null },
    quarterly: { amount: 8073, originalAmount: 8970 },
    yearly: { amount: 28704, originalAmount: 35880 },
  },
  CAMPEAO: {
    monthly: { amount: 4590, originalAmount: null },
    quarterly: { amount: 12393, originalAmount: 13770 },
    yearly: { amount: 44064, originalAmount: 55080 },
  },
  TITA: {
    monthly: { amount: 7490, originalAmount: null },
    quarterly: { amount: 20223, originalAmount: 22470 },
    yearly: { amount: 71904, originalAmount: 89880 },
  },
  LEGEND: {
    monthly: { amount: 11990, originalAmount: null },
    quarterly: { amount: 32373, originalAmount: 35970 },
    yearly: { amount: 115104, originalAmount: 143880 },
  },
};

const PLAN_DETAILS = {
  MESTRE: {
    name: "Mestre",
    icon: Crown,
    iconColor: "text-yellow-500",
    gradient: "from-yellow-500/20 to-yellow-500/5",
    borderColor: "border-yellow-500/30",
    maxClans: 1,
    maxInvites: 1,
    features: [
      "1 Clan",
      "1 Convite",
      "Dashboard Completo",
      "Rankings de Guerras",
      "Estatísticas Avançadas",
      "Suporte por Email",
    ],
  },
  CAMPEAO: {
    name: "Campeão",
    icon: Trophy,
    iconColor: "text-blue-500",
    gradient: "from-blue-500/20 to-blue-500/5",
    borderColor: "border-blue-500/30",
    maxClans: 2,
    maxInvites: 2,

    features: [
      "2 Clans",
      "2 Convites",
      "Dashboard Completo",
      "Rankings de Guerras",
      "Estatísticas Avançadas",
      "Previsões Inteligentes",
      "Suporte Prioritário",
    ],
  },
  TITA: {
    name: "Titã",
    icon: Zap,
    iconColor: "text-purple-500",
    gradient: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/30",
    maxClans: 3,
    maxInvites: 3,
    popular: true,
    features: [
      "3 Clans",
      "3 Convites",
      "Dashboard Completo",
      "Rankings de Guerras",
      "Estatísticas Avançadas",
      "Previsões Inteligentes",
      "Analytics Avançado",
      "Suporte 24/7",
    ],
  },
  LEGEND: {
    name: "Legend",
    icon: Wine,
    iconColor: "text-green-500",
    gradient: "from-green-500/20 to-green-500/5",
    borderColor: "border-green-500/30",
    maxClans: 4,
    maxInvites: 4,
    features: [
      "5 Clans",
      "5 Convites",
      "Dashboard Completo",
      "Rankings de Guerras",
      "Estatísticas Avançadas",
      "Previsões Inteligentes",
      "Analytics Avançado",
      "Suporte 24/7",
    ],
  },
};

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function calculateDiscount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedPeriod, setSelectedPeriod] =
    useState<PaymentPeriod>("monthly");

  const handleSelectPlan = (plan: "MESTRE" | "CAMPEAO" | "TITA" | "LEGEND") => {
    // Salva o plano e período no localStorage
    localStorage.setItem("selectedPlan", plan);
    localStorage.setItem("selectedPeriod", selectedPeriod);
    // Redireciona para a página de criação com tag do clan
    router.push(`/org/new?plan=${plan}&period=${selectedPeriod}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-primary/5 backdrop-blur-sm px-4 py-2 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold">
              Escolha o plano perfeito para você
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Planos que{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              crescem
            </span>{" "}
            com você
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Comece com 3 dias grátis. Sem compromisso. Cancele quando quiser.
          </p>

          {/* Seletor de Período */}
          <div className="flex justify-center mb-8 px-4">
            <div className="inline-flex rounded-xl border-2 border-border bg-card p-1 sm:p-1.5 shadow-lg overflow-x-auto scrollbar-hide max-w-full">
              <button
                type="button"
                onClick={() => setSelectedPeriod("monthly")}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  selectedPeriod === "monthly"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod("quarterly")}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  selectedPeriod === "quarterly"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Trimestral
                <Badge
                  variant="secondary"
                  className="ml-1 sm:ml-2 bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] sm:text-[10px]"
                >
                  10% OFF
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod("yearly")}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  selectedPeriod === "yearly"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anual
                <Badge
                  variant="secondary"
                  className="ml-1 sm:ml-2 bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] sm:text-[10px]"
                >
                  20% OFF
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto mb-12">
          {(["MESTRE", "CAMPEAO", "TITA", "LEGEND"] as const).map((plan) => {
            const details = PLAN_DETAILS[plan];
            const prices = PLAN_PRICES[plan];
            const price = prices[selectedPeriod];
            const Icon = details.icon;
            const isPopular = "popular" in details && details.popular === true;
            const planMonthlyPrice =
              price.amount /
              (selectedPeriod === "monthly"
                ? 1
                : selectedPeriod === "quarterly"
                  ? 3
                  : 12);

            return (
              <Card
                key={plan}
                className={`relative border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  isPopular
                    ? "border-primary shadow-xl scale-105 bg-gradient-to-br from-primary/10 via-primary/5 to-background"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 text-xs font-bold shadow-lg">
                      MAIS POPULAR
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4 pt-8">
                  <div className="flex justify-center mb-4">
                    <div
                      className={`p-4 rounded-2xl bg-gradient-to-br ${details.gradient} border-2 ${details.borderColor} shadow-lg`}
                    >
                      <Icon className={`h-10 w-10 ${details.iconColor}`} />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold mb-2">
                    {details.name}
                  </CardTitle>

                  {price.originalAmount && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(price.originalAmount)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-600 dark:text-green-400 font-semibold"
                      >
                        {calculateDiscount(price.originalAmount, price.amount)}%
                        OFF
                      </Badge>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-4xl font-bold">
                      {formatPrice(price.amount)}
                    </span>
                    <span className="text-muted-foreground text-lg ml-2">
                      /
                      {selectedPeriod === "monthly"
                        ? "mês"
                        : selectedPeriod === "quarterly"
                          ? "trimestre"
                          : "ano"}
                    </span>
                  </div>

                  {selectedPeriod !== "monthly" && (
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(planMonthlyPrice)}/mês equivalente
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-1">
                      3 dias grátis
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cancele quando quiser
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all ${
                      isPopular
                        ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        : ""
                    }`}
                    size="lg"
                  >
                    Começar Agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <p className="text-sm font-semibold text-foreground mb-3">
                      Tudo incluído:
                    </p>
                    {details.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-1 rounded-full bg-green-500/10 mt-0.5 shrink-0">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Recursos incluídos em todos os planos
            </h2>
            <p className="text-muted-foreground">
              Tudo que você precisa para gerenciar seu clã
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Shield,
                title: "Dashboard Completo",
                desc: "Visão geral de todas as estatísticas",
              },
              {
                icon: BarChart3,
                title: "Analytics Avançado",
                desc: "Estatísticas detalhadas e métricas",
              },
              {
                icon: Trophy,
                title: "Rankings",
                desc: "Rankings de guerras e CWL",
              },
              {
                icon: Zap,
                title: "Guerra Atual",
                desc: "Acompanhe guerras em tempo real",
              },
              {
                icon: TrendingUp,
                title: "Previsões",
                desc: "Sistema de previsão inteligente",
              },
              {
                icon: Users,
                title: "Gestão de Membros",
                desc: "Gerencie membros e convites",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Perguntas Frequentes
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Posso mudar de plano depois?",
                a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.",
              },
              {
                q: "O que acontece após o trial de 3 dias?",
                a: "Após o período de trial, sua assinatura será cobrada automaticamente. Você pode cancelar a qualquer momento.",
              },
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas ou multas.",
              },
            ].map((faq, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
