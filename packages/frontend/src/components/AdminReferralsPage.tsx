"use client";

import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, Gift, Users, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ReferredUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

interface ReferrerUser {
  id: string;
  name: string | null;
  email: string;
  referralCode: string;
  createdAt: string;
  referrals: ReferredUser[];
}

export function AdminReferralsPage() {
  const [users, setUsers] = useState<ReferrerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/referrals`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar indicações");
      const json = await res.json();
      setUsers(json.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q) ||
        u.referrals.some(
          (r) => r.name?.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
        )
    );
  }, [users, search]);

  const totalReferrals = users.reduce((acc, u) => acc + u.referrals.length, 0);
  const usersWithReferrals = users.filter((u) => u.referrals.length > 0).length;

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Indicações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize quem indicou quem na plataforma.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de indicações</p>
          <p className="text-2xl font-bold">{loading ? "—" : totalReferrals}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Usuários que indicaram</p>
          <p className="text-2xl font-bold">{loading ? "—" : usersWithReferrals}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Usuários cadastrados</p>
          <p className="text-2xl font-bold">{loading ? "—" : users.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive text-center">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground text-sm">
          Nenhum resultado encontrado.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const isOpen = expanded.has(user.id);
            return (
              <div key={user.id} className="rounded-xl border bg-card overflow-hidden">
                {/* Row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                  onClick={() => user.referrals.length > 0 && toggleExpand(user.id)}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 border border-primary/15 shrink-0">
                    <Gift className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {user.name || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate hidden sm:block">
                        {user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-muted-foreground tracking-wider">
                        {user.referralCode}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        cadastro {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {user.referrals.length > 0 ? (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        {user.referrals.length}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0 indicados</span>
                    )}
                    {user.referrals.length > 0 && (
                      isOpen
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Referrals list */}
                {isOpen && user.referrals.length > 0 && (
                  <div className="border-t divide-y">
                    {user.referrals.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 px-4 py-2.5 bg-muted/30"
                      >
                        <div className="w-5 h-5 ml-1.5 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{r.name || "—"}</span>
                          <span className="text-xs text-muted-foreground ml-2">{r.email}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
