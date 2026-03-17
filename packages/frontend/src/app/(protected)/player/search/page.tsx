"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Search, UserSearch, XCircle } from "lucide-react";
import { getPlayer, type PlayerDetails } from "@/lib/api";
import { PlayerDetailsContent } from "@/components/PlayerDetailsContent";
import { cn } from "@/lib/utils";

function PlayerSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [playerTag, setPlayerTag] = useState(searchParams.get("tag") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<PlayerDetails | null>(null);

  const loadPlayerData = useCallback(async (tag: string) => {
    if (!tag.trim()) {
      setPlayerData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPlayer(tag.trim().replace(/^#/, ""));
      setPlayerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar jogador");
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const tag = searchParams.get("tag");
    if (tag) {
      setPlayerTag(tag);
      loadPlayerData(tag);
    } else {
      setPlayerTag("");
      setPlayerData(null);
      setError(null);
    }
  }, [searchParams, loadPlayerData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerTag.trim()) {
      setError("Por favor, insira a tag do jogador");
      return;
    }
    const cleanTag = playerTag.trim().replace(/^#/, "");
    router.push(`/player/search?tag=${encodeURIComponent(cleanTag)}`, { scroll: false });
  };

  const hasSearched = !!searchParams.get("tag");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Buscar Jogador</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pesquise qualquer jogador pelo tag do Clash of Clans
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tag do jogador (ex: #ABC123)"
            value={playerTag}
            onChange={(e) => {
              setPlayerTag(e.target.value);
              setError(null);
            }}
            disabled={loading}
            className={cn("pl-10 h-11", error && "border-destructive focus-visible:ring-destructive")}
          />
        </div>
        <Button type="submit" disabled={loading || !playerTag.trim()} className="h-11 px-6 shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </Button>
      </form>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm border bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <PlayerSkeleton />}

      {/* Player results */}
      {playerData && !loading && <PlayerDetailsContent playerData={playerData} />}

      {/* Empty state — only when no search has been done */}
      {!hasSearched && !loading && (
        <div className="text-center py-20 border rounded-2xl bg-card">
          <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
            <UserSearch className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold mb-1">Busque um jogador</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Digite a tag do jogador para ver estatísticas detalhadas e histórico de guerras
          </p>
          <p className="mt-3 text-xs font-mono bg-muted text-muted-foreground inline-block px-3 py-1.5 rounded-lg">
            #ABC123
          </p>
        </div>
      )}
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border bg-card space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
          <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[96, 80, 72, 88, 64].map((w, i) => (
            <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />
    </div>
  );
}

export default function PlayerSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-24 max-w-7xl flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PlayerSearchContent />
    </Suspense>
  );
}
