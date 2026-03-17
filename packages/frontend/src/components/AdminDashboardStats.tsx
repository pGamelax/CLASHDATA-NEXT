"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  CreditCard,
  Shield,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Crown,
  Zap,
  Star,
  ArrowRight,
  CalendarClock,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
}

interface RecentOrg {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  subscription: { plan: string; status: string } | null;
}

interface ExpiringSub {
  id: string;
  plan: string;
  currentPeriodEnd: string;
  organization: { id: string; name: string; slug: string };
}

interface DashboardStats {
  users: {
    total: number;
    thisMonth: number;
    last7Days: number;
    recent: RecentUser[];
  };
  organizations: {
    total: number;
    thisMonth: number;
    withoutSubscription: number;
    recent: RecentOrg[];
  };
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    expired: number;
    cancelled: number;
    byPlan: Array<{ plan: string; count: number }>;
    expiringSoon: ExpiringSub[];
  };
  clans: {
    total: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  LEGEND: { label: "Legend", color: "text-purple-400", bgColor: "bg-purple-500/15", icon: Crown },
  TITA:   { label: "Titã",   color: "text-blue-400",   bgColor: "bg-blue-500/15",   icon: Star },
  CAMPEAO:{ label: "Campeão",color: "text-green-400",  bgColor: "bg-green-500/15",  icon: Zap },
  MESTRE: { label: "Mestre", color: "text-yellow-400", bgColor: "bg-yellow-500/15", icon: Shield },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  ACTIVE:    { label: "Ativa",     color: "text-green-400", dotColor: "bg-green-500" },
  TRIAL:     { label: "Trial",     color: "text-blue-400",  dotColor: "bg-blue-500"  },
  EXPIRED:   { label: "Expirada",  color: "text-red-400",   dotColor: "bg-red-500"   },
  CANCELLED: { label: "Cancelada", color: "text-zinc-500",  dotColor: "bg-zinc-500"  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

// ── Sub-components ─────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  sub,
  sub2,
  alert,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: number;
  sub: string;
  sub2?: string;
  alert?: boolean;
}) {
  return (
    <Card className={cn("relative overflow-hidden", alert && "border-amber-500/40")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
            <p className="text-3xl font-bold tabular-nums">{value.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
            {sub2 && <p className="text-xs text-muted-foreground">{sub2}</p>}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
        {alert && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500/60" />
        )}
      </CardContent>
    </Card>
  );
}

function HealthBar({ stats }: { stats: DashboardStats }) {
  const subs = stats.subscriptions;
  const total = subs.total || 1;
  const segments = [
    { key: "active",    count: subs.active,    color: "bg-green-500", label: "Ativas" },
    { key: "trial",     count: subs.trial,     color: "bg-blue-500",  label: "Trial"  },
    { key: "expired",   count: subs.expired,   color: "bg-red-500",   label: "Expiradas" },
    { key: "cancelled", count: subs.cancelled, color: "bg-zinc-500",  label: "Canceladas" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Saúde das Assinaturas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked bar */}
        <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
          {segments.map((s) =>
            s.count > 0 ? (
              <div
                key={s.key}
                className={cn("transition-all rounded-sm", s.color)}
                style={{ width: `${(s.count / total) * 100}%` }}
              />
            ) : null
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {segments.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 rounded-full shrink-0", s.color)} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums">{s.count}</span>
            </div>
          ))}
        </div>

        {/* Expiring alert */}
        {subs.expiringSoon.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-400">
                {subs.expiringSoon.length} assinatura{subs.expiringSoon.length > 1 ? "s" : ""} expira{subs.expiringSoon.length > 1 ? "m" : ""} em 7 dias
              </p>
              <div className="mt-1 space-y-0.5">
                {subs.expiringSoon.slice(0, 3).map((s) => (
                  <p key={s.id} className="text-[11px] text-muted-foreground truncate">
                    {s.organization.name} — {daysUntil(s.currentPeriodEnd as unknown as string)}d ({PLAN_CONFIG[s.plan]?.label || s.plan})
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orgs without sub */}
        {stats.organizations.withoutSubscription > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700/60 bg-muted/40 px-3 py-2">
            <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.organizations.withoutSubscription}</span> org{stats.organizations.withoutSubscription > 1 ? "s" : ""} sem assinatura
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanDistribution({ stats }: { stats: DashboardStats }) {
  const plans = stats.subscriptions.byPlan;
  const maxCount = Math.max(...plans.map((p) => p.count), 1);
  const order = ["LEGEND", "TITA", "CAMPEAO", "MESTRE"];
  const sorted = [...plans].sort((a, b) => order.indexOf(a.plan) - order.indexOf(b.plan));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Distribuição por Plano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma assinatura</p>
        ) : (
          sorted.map((item) => {
            const cfg = PLAN_CONFIG[item.plan] || { label: item.plan, color: "text-foreground", bgColor: "bg-muted", icon: Shield };
            const Icon = cfg.icon;
            const pct = Math.round((item.count / maxCount) * 100);
            return (
              <div key={item.plan} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    <span className="text-xs font-medium">{cfg.label}</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums">{item.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", cfg.bgColor.replace("/15", ""))}
                    style={{ width: `${pct}%`, opacity: 0.7 }}
                  />
                </div>
              </div>
            );
          })
        )}

        <div className="pt-1 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total de assinaturas</span>
            <span className="font-bold">{stats.subscriptions.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentUsers({ users }: { users: RecentUser[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            Cadastros Recentes
          </CardTitle>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {users.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 px-4">Nenhum usuário recente</p>
        ) : (
          <div className="divide-y">
            {users.map((u) => {
              const initials = u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  {/* Avatar */}
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0",
                    u.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {initials}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate">{u.name || "—"}</p>
                      {u.role === "admin" && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-primary border-primary/30">admin</Badge>
                      )}
                      {u.banned && (
                        <Ban className="h-3 w-3 text-destructive shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  {/* Time */}
                  <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(u.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertsPanel({ stats }: { stats: DashboardStats }) {
  const expiring = stats.subscriptions.expiringSoon;
  const noSub = stats.organizations.withoutSubscription;
  const hasAlerts = expiring.length > 0 || noSub > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Alertas & Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerts */}
        <div className="space-y-2">
          {!hasAlerts && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/8 px-3 py-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
              <p className="text-xs text-green-400 font-medium">Tudo em ordem — sem alertas</p>
            </div>
          )}

          {expiring.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <p className="text-xs font-semibold text-amber-400">Expiram em breve</p>
              </div>
              <div className="space-y-1.5">
                {expiring.map((s) => {
                  const days = daysUntil(s.currentPeriodEnd as unknown as string);
                  const cfg = PLAN_CONFIG[s.plan];
                  return (
                    <Link key={s.id} href={`/admin/organizations`}>
                      <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-amber-500/10 transition-colors cursor-pointer">
                        <p className="text-[11px] font-medium truncate">{s.organization.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn("text-[10px] font-semibold", cfg?.color)}>{cfg?.label || s.plan}</span>
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-1.5 py-0 h-4 border-amber-500/40",
                            days <= 2 ? "text-red-400 border-red-500/40" : "text-amber-400"
                          )}>
                            {days}d
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {noSub > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-zinc-700/60 bg-muted/40 px-3 py-2.5">
              <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">Orgs sem assinatura</p>
                <p className="text-[11px] text-muted-foreground">{noSub} organização{noSub > 1 ? "s" : ""} não têm plano ativo</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-1.5 pt-1 border-t">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ações Rápidas</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { href: "/admin/users",         icon: Users,        label: "Usuários" },
              { href: "/admin/organizations", icon: Building2,    label: "Organizações" },
              { href: "/admin/subscriptions", icon: CreditCard,   label: "Assinaturas" },
              { href: "/admin/season-dates",  icon: CalendarClock,label: "Temporadas" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-start gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function AdminDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${apiUrl}/admin/stats`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
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
    fetchStats();
  }, [fetchStats]);

  // ── Skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-7 w-52 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-36 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-24 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <XCircle className="h-8 w-8 opacity-40" />
        <p className="text-sm">Erro ao carregar o dashboard</p>
        <Button variant="outline" size="sm" onClick={() => fetchStats()}>Tentar novamente</Button>
      </div>
    );
  }

  const alertCount = stats.subscriptions.expiringSoon.length + (stats.organizations.withoutSubscription > 0 ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Dashboard
            {alertCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-black">
                {alertCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lastUpdated
              ? `Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : "Visão geral do sistema"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/15"
          title="Usuários"
          value={stats.users.total}
          sub={`+${stats.users.thisMonth} este mês`}
          sub2={`+${stats.users.last7Days} últimos 7 dias`}
        />
        <KpiCard
          icon={Building2}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/15"
          title="Organizações"
          value={stats.organizations.total}
          sub={`+${stats.organizations.thisMonth} este mês`}
          sub2={`${stats.organizations.withoutSubscription} sem plano`}
          alert={stats.organizations.withoutSubscription > 0}
        />
        <KpiCard
          icon={CreditCard}
          iconColor="text-green-400"
          iconBg="bg-green-500/15"
          title="Assinaturas ativas"
          value={stats.subscriptions.active}
          sub={`${stats.subscriptions.trial} em trial`}
          sub2={`${stats.subscriptions.expired} expiradas`}
          alert={stats.subscriptions.expiringSoon.length > 0}
        />
        <KpiCard
          icon={Shield}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/15"
          title="Clans"
          value={stats.clans.total}
          sub="Cadastrados no sistema"
        />
      </div>

      {/* ── Middle: Health + Plan Distribution ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HealthBar stats={stats} />
        <PlanDistribution stats={stats} />
      </div>

      {/* ── Bottom: Recent Users + Alerts ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecentUsers users={stats.users.recent} />
        <AlertsPanel stats={stats} />
      </div>

      {/* ── Recent Orgs ─────────────────────────────────────────── */}
      {stats.organizations.recent.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Organizações Recentes
              </CardTitle>
              <Link href="/admin/organizations">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                  Ver todas <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {stats.organizations.recent.map((org) => {
                const subCfg = org.subscription ? STATUS_CONFIG[org.subscription.status] : null;
                const planCfg = org.subscription ? PLAN_CONFIG[org.subscription.plan] : null;
                return (
                  <div key={org.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{org.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{org.slug}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {planCfg && (
                        <span className={cn("text-[10px] font-semibold", planCfg.color)}>{planCfg.label}</span>
                      )}
                      {subCfg ? (
                        <div className="flex items-center gap-1">
                          <div className={cn("h-1.5 w-1.5 rounded-full", subCfg.dotColor)} />
                          <span className={cn("text-[11px]", subCfg.color)}>{subCfg.label}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">sem plano</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(org.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
