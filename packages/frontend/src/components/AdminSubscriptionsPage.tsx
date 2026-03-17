"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Search, RefreshCw, AlertCircle, Clock, Crown, Star, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  LEGEND:  { label: "Legend",  color: "text-purple-400", icon: Crown  },
  TITA:    { label: "Titã",    color: "text-blue-400",   icon: Star   },
  CAMPEAO: { label: "Campeão", color: "text-green-400",  icon: Zap    },
  MESTRE:  { label: "Mestre",  color: "text-yellow-400", icon: Shield },
};

const STATUS_CONFIG: Record<string, { label: string; badgeCn: string; tab: string }> = {
  ACTIVE:    { label: "Ativa",     badgeCn: "bg-green-500/15 text-green-400 border-green-500/30",  tab: "active"    },
  TRIAL:     { label: "Trial",     badgeCn: "bg-blue-500/15 text-blue-400 border-blue-500/30",     tab: "trial"     },
  EXPIRED:   { label: "Expirada",  badgeCn: "bg-red-500/15 text-red-400 border-red-500/30",        tab: "expired"   },
  CANCELLED: { label: "Cancelada", badgeCn: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",     tab: "cancelled" },
};

const TABS = [
  { key: "all",       label: "Todas"     },
  { key: "active",    label: "Ativas"    },
  { key: "trial",     label: "Trial"     },
  { key: "expired",   label: "Expiradas" },
  { key: "cancelled", label: "Canceladas"},
];

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b last:border-0">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="hidden sm:block h-5 w-16 rounded-full" />
      <Skeleton className="hidden md:block h-5 w-14 rounded-full" />
      <Skeleton className="hidden lg:block h-3 w-28" />
      <Skeleton className="hidden xl:block h-3 w-20" />
    </div>
  );
}

export function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/admin/subscriptions`, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar assinaturas");
      const data = await res.json();
      setSubs(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  // Tab counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: subs.length };
    subs.forEach((s) => {
      const t = STATUS_CONFIG[s.status]?.tab;
      if (t) c[t] = (c[t] || 0) + 1;
    });
    return c;
  }, [subs]);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.organization?.name?.toLowerCase().includes(q) || s.organization?.slug?.toLowerCase().includes(q);
      const matchTab = tab === "all" || STATUS_CONFIG[s.status]?.tab === tab;
      return matchSearch && matchTab;
    });
  }, [subs, search, tab]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
            Assinaturas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando..." : `${subs.length} assinatura${subs.length !== 1 ? "s" : ""} no total`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => fetchSubs(true)} disabled={refreshing || loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Search + tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por organização..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0",
                tab === t.key
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
              )}
            >
              {t.label}
              {!loading && counts[t.key] !== undefined && (
                <span className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  tab === t.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {counts[t.key] || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <Card>
        {loading ? (
          <div>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <CreditCard className="h-8 w-8 opacity-30" />
            <p className="text-sm">{search || tab !== "all" ? "Nenhuma assinatura encontrada." : "Nenhuma assinatura cadastrada."}</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {filtered.map((sub) => {
              const statusCfg = STATUS_CONFIG[sub.status];
              const planCfg = PLAN_CONFIG[sub.plan];
              const PlanIcon = planCfg?.icon || CreditCard;
              const expiryDate = sub.currentPeriodEnd || sub.trialEndsAt || null;
              const days = daysUntil(expiryDate);
              const isExpiringSoon = days !== null && days >= 0 && days <= 7 && sub.status === "ACTIVE";
              const isManual = sub.paymentProvider === "manual";
              const owner = sub.organization?.members?.find((m: any) => m.role === "owner");

              return (
                <div key={sub.id} className={cn(
                  "flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors",
                  isExpiringSoon && "border-l-2 border-l-amber-500/60"
                )}>
                  {/* Plan icon */}
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                    planCfg ? "bg-muted" : "bg-muted"
                  )}>
                    <PlanIcon className={cn("h-4 w-4", planCfg?.color || "text-muted-foreground")} />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate">{sub.organization?.name || "—"}</p>
                      {isManual && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">manual</Badge>
                      )}
                    </div>
                    {owner && (
                      <p className="text-[11px] text-muted-foreground truncate">{owner.user?.name || owner.user?.email || "—"}</p>
                    )}
                  </div>

                  {/* Plan */}
                  {planCfg && (
                    <div className={cn("hidden sm:flex items-center gap-1 text-[11px] font-semibold shrink-0", planCfg.color)}>
                      <PlanIcon className="h-3 w-3" />{planCfg.label}
                    </div>
                  )}

                  {/* Status */}
                  {statusCfg && (
                    <Badge className={cn("hidden md:inline-flex text-[11px] px-2 h-5 border shrink-0", statusCfg.badgeCn)}>
                      {statusCfg.label}
                    </Badge>
                  )}

                  {/* Expiry */}
                  {expiryDate && (
                    <div className={cn(
                      "hidden lg:flex items-center gap-1 text-[11px] shrink-0",
                      isExpiringSoon ? "text-amber-400 font-semibold" : "text-muted-foreground"
                    )}>
                      {isExpiringSoon && <Clock className="h-3 w-3" />}
                      {days !== null && days >= 0 && days <= 30
                        ? `${days}d restantes`
                        : new Date(expiryDate).toLocaleDateString("pt-BR")}
                    </div>
                  )}

                  {/* Created */}
                  <span className="hidden xl:block text-[11px] text-muted-foreground shrink-0">
                    {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando {filtered.length} de {subs.length} assinaturas
        </p>
      )}
    </div>
  );
}
