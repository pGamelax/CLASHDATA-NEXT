"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Search,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Users,
  Building2,
  Crown,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  LEGEND:  { label: "Legend",  color: "text-purple-400", icon: Crown },
  TITA:    { label: "Titã",    color: "text-blue-400",   icon: Star  },
  CAMPEAO: { label: "Campeão", color: "text-green-400",  icon: Zap   },
  MESTRE:  { label: "Mestre",  color: "text-yellow-400", icon: Shield },
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    "bg-green-500/15 text-green-400 border-green-500/30",
  TRIAL:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
  EXPIRED:   "bg-red-500/15 text-red-400 border-red-500/30",
  CANCELLED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativa", TRIAL: "Trial", EXPIRED: "Expirada", CANCELLED: "Cancelada",
};

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="hidden sm:block h-3 w-28" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-10 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

export function AdminClansPage() {
  const [clans, setClans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchClans = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/admin/clans`, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar clans");
      const data = await res.json();
      setClans(data.data || []);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar clans");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchClans(); }, [fetchClans]);

  const handleDelete = async (clanId: string) => {
    setDeleting(clanId);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_URL}/admin/clans/${clanId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        setDeleteError(err.message || "Erro ao excluir clan");
        return;
      }
      setClans((prev) => prev.filter((c) => c.id !== clanId));
    } catch {
      setDeleteError("Erro ao excluir clan");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = clans.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.tag?.toLowerCase().includes(q) ||
      c.organization?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-muted-foreground" />
            Clans
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando..." : `${clans.length} clan${clans.length !== 1 ? "s" : ""} cadastrado${clans.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => fetchClans(true)} disabled={refreshing || loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {deleteError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {deleteError}
        </div>
      )}

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tag ou organização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {!loading && (
          <span className="text-sm text-muted-foreground shrink-0">
            {filtered.length} de {clans.length}
          </span>
        )}
      </div>

      {/* List */}
      <Card>
        {loading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Shield className="h-8 w-8 opacity-30" />
            <p className="text-sm">{search ? "Nenhum clan encontrado para essa busca." : "Nenhum clan cadastrado."}</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {filtered.map((clan) => {
              const sub = clan.organization?.subscription;
              const planCfg = sub ? PLAN_CONFIG[sub.plan] : null;
              const PlanIcon = planCfg?.icon || Shield;

              return (
                <div key={clan.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                  {/* Icon */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{clan.name}</p>
                      <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0 h-5">{clan.tag}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {clan.organization && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {clan.organization.name}
                        </span>
                      )}
                      {clan.clanLevel && (
                        <span className="text-[11px] text-muted-foreground">Nível {clan.clanLevel}</span>
                      )}
                    </div>
                  </div>

                  {/* Members */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Users className="h-3.5 w-3.5" />
                    {clan.members ?? "—"}
                  </div>

                  {/* Plan badge */}
                  {planCfg && (
                    <div className={cn("hidden sm:flex items-center gap-1 text-[11px] font-medium shrink-0", planCfg.color)}>
                      <PlanIcon className="h-3 w-3" />
                      {planCfg.label}
                    </div>
                  )}

                  {/* Subscription status */}
                  {sub && (
                    <Badge className={cn("hidden md:inline-flex text-[11px] px-2 h-5 border", STATUS_COLOR[sub.status])}>
                      {STATUS_LABEL[sub.status] || sub.status}
                    </Badge>
                  )}

                  {/* Date */}
                  <span className="hidden lg:block text-[11px] text-muted-foreground shrink-0">
                    {new Date(clan.createdAt).toLocaleDateString("pt-BR")}
                  </span>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" disabled={deleting === clan.id}>
                        {deleting === clan.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir clan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir <strong>{clan.name}</strong> ({clan.tag})?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(clan.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
