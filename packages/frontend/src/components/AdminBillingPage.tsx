"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  Ban,
  Crown,
  Zap,
  Star,
  Shield,
  CalendarDays,
  BarChart3,
  Receipt,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

interface MonthlyRevenue {
  month: string; // "2025-03"
  amount: number;
  count: number;
}

interface PaymentByStatus {
  status: string;
  count: number;
  amount: number;
}

interface RevenueByPlan {
  plan: string;
  count: number;
  amount: number;
}

interface RevenueByPeriod {
  period: string;
  count: number;
  amount: number;
}

interface RecentPayment {
  id: string;
  amount: number;
  plan: string;
  period: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  organization: { id: string; name: string } | null;
}

interface BillingStats {
  revenue: {
    total: number;
    totalCount: number;
    thisMonth: number;
    thisMonthCount: number;
    lastMonth: number;
    lastMonthCount: number;
    thisYear: number;
    thisYearCount: number;
  };
  mrr: number;
  arr: number;
  paymentsByStatus: PaymentByStatus[];
  revenueByPlan: RevenueByPlan[];
  revenueByPeriod: RevenueByPeriod[];
  monthlyRevenue: MonthlyRevenue[];
  recentPayments: RecentPayment[];
  activeSubscriptionsCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, { label: string; color: string; barColor: string; icon: React.ElementType }> = {
  LEGEND:  { label: "Legend",  color: "text-purple-400", barColor: "bg-purple-500", icon: Crown  },
  TITA:    { label: "Titã",    color: "text-blue-400",   barColor: "bg-blue-500",   icon: Star   },
  CAMPEAO: { label: "Campeão", color: "text-green-400",  barColor: "bg-green-500",  icon: Zap    },
  MESTRE:  { label: "Mestre",  color: "text-yellow-400", barColor: "bg-yellow-500", icon: Shield },
};

const PERIOD_CONFIG: Record<string, { label: string; color: string }> = {
  monthly:   { label: "Mensal",    color: "text-blue-400"   },
  quarterly: { label: "Trimestral",color: "text-violet-400" },
  yearly:    { label: "Anual",     color: "text-green-400"  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; badgeClass: string; icon: React.ElementType }> = {
  PAID:      { label: "Pago",       color: "text-green-400", badgeClass: "border-green-500/40 text-green-400", icon: CheckCircle2 },
  PENDING:   { label: "Pendente",   color: "text-yellow-400",badgeClass: "border-yellow-500/40 text-yellow-400",icon: Clock       },
  EXPIRED:   { label: "Expirado",   color: "text-red-400",   badgeClass: "border-red-500/40 text-red-400",    icon: Ban         },
  CANCELLED: { label: "Cancelado",  color: "text-zinc-500",  badgeClass: "border-zinc-600 text-zinc-500",     icon: XCircle     },
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function growthBadge(current: number, previous: number) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const isPos = pct >= 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-[11px] font-semibold", isPos ? "text-green-400" : "text-red-400")}>
      {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function RevenueKpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  sub,
  growth,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  sub?: string;
  growth?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
              {growth}
            </div>
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyRevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Receita Mensal — Últimos 12 meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 h-36">
          {data.map((item) => {
            const heightPct = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
            const isCurrentMonth = item.month === (() => {
              const n = new Date();
              return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
            })();
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="rounded-md bg-popover border px-2 py-1.5 text-[11px] shadow-md whitespace-nowrap">
                    <p className="font-semibold">{formatBRL(item.amount)}</p>
                    <p className="text-muted-foreground">{item.count} pag.</p>
                  </div>
                  <div className="w-2 h-2 bg-popover border-b border-r rotate-45 -mt-1 border-border" />
                </div>
                {/* Bar */}
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all",
                      isCurrentMonth ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                    )}
                    style={{ height: `${Math.max(heightPct, item.amount > 0 ? 4 : 1)}%` }}
                  />
                </div>
                {/* Label */}
                <span className="text-[9px] text-muted-foreground rotate-0 leading-none">
                  {formatMonthLabel(item.month)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Y-axis hint */}
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">R$ 0</span>
          <span className="text-[10px] text-muted-foreground">{formatBRL(maxAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueByPlanCard({ data }: { data: RevenueByPlan[] }) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const order = ["LEGEND", "TITA", "CAMPEAO", "MESTRE"];
  const sorted = [...data].sort((a, b) => order.indexOf(a.plan) - order.indexOf(b.plan));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Crown className="h-4 w-4 text-muted-foreground" />
          Receita por Plano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum pagamento registrado</p>
        ) : (
          sorted.map((item) => {
            const cfg = PLAN_CONFIG[item.plan] ?? { label: item.plan, color: "text-foreground", barColor: "bg-primary", icon: Shield };
            const Icon = cfg.icon;
            const pct = Math.round((item.amount / maxAmount) * 100);
            return (
              <div key={item.plan} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    <span className="text-xs font-medium">{cfg.label}</span>
                    <span className="text-[10px] text-muted-foreground">({item.count} pag.)</span>
                  </div>
                  <span className={cn("text-xs font-bold tabular-nums", cfg.color)}>{formatBRL(item.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", cfg.barColor)}
                    style={{ width: `${pct}%`, opacity: 0.75 }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function RevenueByPeriodCard({ data }: { data: RevenueByPeriod[] }) {
  const total = data.reduce((acc, d) => acc + d.amount, 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Receita por Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum pagamento registrado</p>
        ) : (
          data.map((item) => {
            const cfg = PERIOD_CONFIG[item.period] ?? { label: item.period, color: "text-foreground" };
            const pct = Math.round((item.amount / total) * 100);
            return (
              <div key={item.period} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
                    <span className="text-[10px] text-muted-foreground">({item.count} pag.)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    <span className="text-xs font-bold tabular-nums">{formatBRL(item.amount)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function PaymentStatusCard({ data }: { data: PaymentByStatus[] }) {
  const order = ["PAID", "PENDING", "EXPIRED", "CANCELLED"];
  const sorted = [...data].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const totalCount = data.reduce((acc, d) => acc + d.count, 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Status dos Pagamentos PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Stacked bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
          {sorted.map((item) => {
            const cfg = STATUS_CONFIG[item.status];
            const pct = (item.count / totalCount) * 100;
            if (pct === 0) return null;
            const barColor = item.status === "PAID" ? "bg-green-500" : item.status === "PENDING" ? "bg-yellow-500" : item.status === "EXPIRED" ? "bg-red-500" : "bg-zinc-500";
            return (
              <div key={item.status} className={cn("rounded-sm", barColor)} style={{ width: `${pct}%` }} />
            );
          })}
        </div>

        {sorted.map((item) => {
          const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, color: "text-foreground", badgeClass: "", icon: Clock };
          const Icon = cfg.icon;
          return (
            <div key={item.status} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                <span className="text-xs font-medium">{cfg.label}</span>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", cfg.badgeClass)}>
                  {item.count}
                </Badge>
              </div>
              {item.status === "PAID" && (
                <span className="text-xs font-bold tabular-nums text-green-400">{formatBRL(item.amount)}</span>
              )}
              {item.status === "PENDING" && (
                <span className="text-xs font-medium tabular-nums text-yellow-400">{formatBRL(item.amount)}</span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RecentPaymentsTable({ payments }: { payments: RecentPayment[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          Últimos Pagamentos Confirmados
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">Nenhum pagamento confirmado</p>
        ) : (
          <div className="divide-y">
            {payments.map((p) => {
              const planCfg = PLAN_CONFIG[p.plan] ?? { label: p.plan, color: "text-foreground", icon: Shield };
              const periodCfg = PERIOD_CONFIG[p.period] ?? { label: p.period, color: "text-foreground" };
              const PlanIcon = planCfg.icon;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {p.organization?.name ?? "Organização removida"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PlanIcon className={cn("h-3 w-3", planCfg.color)} />
                      <span className={cn("text-[10px] font-medium", planCfg.color)}>{planCfg.label}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className={cn("text-[10px]", periodCfg.color)}>{periodCfg.label}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums text-green-400">{formatBRL(p.amount)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function AdminBillingPage() {
  const [billing, setBilling] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchBilling = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${apiUrl}/admin/billing`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBilling(data.billing);
        setLastUpdated(new Date());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-36 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-24 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-56 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <XCircle className="h-8 w-8 opacity-40" />
        <p className="text-sm">Erro ao carregar dados de faturamento</p>
        <Button variant="outline" size="sm" onClick={() => fetchBilling()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const monthGrowth = growthBadge(billing.revenue.thisMonth, billing.revenue.lastMonth);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-400" />
            Faturamento
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lastUpdated
              ? `Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : "Análise financeira completa"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => fetchBilling(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueKpiCard
          icon={TrendingUp}
          iconColor="text-green-400"
          iconBg="bg-green-500/15"
          title="MRR Projetado"
          value={formatBRL(billing.mrr)}
          sub={`${billing.activeSubscriptionsCount} assinaturas ativas`}
        />
        <RevenueKpiCard
          icon={BarChart3}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/15"
          title="ARR Projetado"
          value={formatBRL(billing.arr)}
          sub="Receita anual recorrente"
        />
        <RevenueKpiCard
          icon={DollarSign}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/15"
          title="Receita do Mês"
          value={formatBRL(billing.revenue.thisMonth)}
          sub={`${billing.revenue.thisMonthCount} pagamentos`}
          growth={monthGrowth}
        />
        <RevenueKpiCard
          icon={Receipt}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/15"
          title="Receita Total"
          value={formatBRL(billing.revenue.total)}
          sub={`${billing.revenue.totalCount} pagamentos`}
        />
      </div>

      {/* ── Secondary KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Mês Anterior",
            value: formatBRL(billing.revenue.lastMonth),
            sub: `${billing.revenue.lastMonthCount} pag.`,
            color: "text-muted-foreground",
          },
          {
            label: "Este Ano",
            value: formatBRL(billing.revenue.thisYear),
            sub: `${billing.revenue.thisYearCount} pag.`,
            color: "text-foreground",
          },
          {
            label: "MRR × 12 (ARR)",
            value: formatBRL(billing.arr),
            sub: "Projeção anual",
            color: "text-foreground",
          },
          {
            label: "Ticket Médio",
            value: billing.revenue.totalCount > 0
              ? formatBRL(Math.round(billing.revenue.total / billing.revenue.totalCount))
              : "—",
            sub: "por pagamento",
            color: "text-foreground",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
              <p className={cn("text-lg font-bold tabular-nums", item.color)}>{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Monthly Revenue Chart ───────────────────────────────── */}
      <MonthlyRevenueChart data={billing.monthlyRevenue} />

      {/* ── Plan + Period + Status ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RevenueByPlanCard data={billing.revenueByPlan} />
        <RevenueByPeriodCard data={billing.revenueByPeriod} />
        <PaymentStatusCard data={billing.paymentsByStatus} />
      </div>

      {/* ── Recent Payments ─────────────────────────────────────── */}
      <RecentPaymentsTable payments={billing.recentPayments} />
    </div>
  );
}
