import { Shield, Crown, Zap, Star } from "lucide-react";

export type Plan = "MESTRE" | "CAMPEAO" | "TITA" | "LEGEND";
export type Period = "monthly" | "quarterly" | "yearly";

export const PLAN_ORDER: Plan[] = ["MESTRE", "CAMPEAO", "TITA", "LEGEND"];

export const PLAN_NAMES: Record<Plan, string> = {
  MESTRE: "Mestre",
  CAMPEAO: "Campeão",
  TITA: "Titã",
  LEGEND: "Legend",
};

/** Monthly base prices in BRL (float) */
export const PLAN_MONTHLY_PRICE: Record<Plan, number> = {
  MESTRE: 29.9,
  CAMPEAO: 45.9,
  TITA: 74.9,
  LEGEND: 119.9,
};

/** Prices in BRL cents per billing period (matches Stripe amounts) */
export const PLAN_PRICES_CENTS: Record<
  Plan,
  Record<Period, { amount: number; originalAmount: number | null }>
> = {
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

export const PLAN_LIMITS: Record<Plan, { maxClans: number; maxInvites: number }> = {
  MESTRE: { maxClans: 1, maxInvites: 1 },
  CAMPEAO: { maxClans: 2, maxInvites: 2 },
  TITA: { maxClans: 3, maxInvites: 3 },
  LEGEND: { maxClans: 5, maxInvites: 5 },
};

export const PLAN_LEVEL: Record<Plan, number> = {
  MESTRE: 1,
  CAMPEAO: 2,
  TITA: 3,
  LEGEND: 4,
};

export const PLAN_ICONS = {
  MESTRE: Shield,
  CAMPEAO: Crown,
  TITA: Zap,
  LEGEND: Star,
};

export const PLAN_COLORS: Record<Plan, { icon: string; gradient: string; border: string }> = {
  MESTRE: {
    icon: "text-blue-500",
    gradient: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30",
  },
  CAMPEAO: {
    icon: "text-yellow-500",
    gradient: "from-yellow-500/20 to-yellow-500/5",
    border: "border-yellow-500/30",
  },
  TITA: {
    icon: "text-purple-500",
    gradient: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30",
  },
  LEGEND: {
    icon: "text-green-500",
    gradient: "from-green-500/20 to-green-500/5",
    border: "border-green-500/30",
  },
};

export const PLAN_FEATURES: Record<Plan, string[]> = {
  MESTRE: [
    "1 Clã",
    "1 Convite",
    "Dashboard Completo",
    "Rankings de Guerras",
    "Estatísticas Avançadas",
    "Suporte por Email",
  ],
  CAMPEAO: [
    "2 Clãs",
    "2 Convites",
    "Dashboard Completo",
    "Rankings de Guerras",
    "Estatísticas Avançadas",
    "Previsões Inteligentes",
    "Suporte Prioritário",
  ],
  TITA: [
    "3 Clãs",
    "3 Convites",
    "Dashboard Completo",
    "Rankings de Guerras",
    "Estatísticas Avançadas",
    "Previsões Inteligentes",
    "Analytics Avançado",
    "Suporte 24/7",
  ],
  LEGEND: [
    "5 Clãs",
    "5 Convites",
    "Dashboard Completo",
    "Rankings de Guerras",
    "Estatísticas Avançadas",
    "Previsões Inteligentes",
    "Analytics Avançado",
    "Suporte 24/7",
  ],
};

export const POPULAR_PLAN: Plan = "TITA";

export const PERIOD_LABELS: Record<Period, string> = {
  monthly: "mês",
  quarterly: "trimestre",
  yearly: "ano",
};

export const PERIOD_NAMES: Record<Period, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

export const PERIOD_DISCOUNTS: Record<Period, string | null> = {
  monthly: null,
  quarterly: "10% OFF",
  yearly: "20% OFF",
};

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function getPlanLevel(plan: Plan): number {
  return PLAN_LEVEL[plan];
}

export function isUpgrade(from: Plan, to: Plan): boolean {
  return getPlanLevel(to) > getPlanLevel(from);
}

export function isDowngrade(from: Plan, to: Plan): boolean {
  return getPlanLevel(to) < getPlanLevel(from);
}
