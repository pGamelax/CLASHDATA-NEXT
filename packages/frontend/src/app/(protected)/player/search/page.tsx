"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { getPlayer, type PlayerStats } from "@/lib/api";
import { PlayerDetailsContent } from "@/components/PlayerDetailsContent";

function PlayerSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get("tag");
  
  const [playerTag, setPlayerTag] = useState(tagFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);

  const loadPlayerData = useCallback(async (tag: string) => {
    if (!tag.trim()) {
      setPlayerData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanTag = tag.trim().replace(/^#/, "");
      const data = await getPlayer(cleanTag);
      setPlayerData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar jogador";
      setError(errorMessage);
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
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerTag.trim()) {
      setError("Por favor, insira a tag do jogador");
      return;
    }

    const cleanTag = playerTag.trim().replace(/^#/, "");
    router.push(`/player/search?tag=${encodeURIComponent(cleanTag)}`, { scroll: false });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 items-start">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="playerTag"
              placeholder="Digite a tag do jogador (ex: #ABC123)"
              value={playerTag}
              onChange={(e) => {
                setPlayerTag(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className="pl-10 h-11"
            />
            {error && (
              <p className="text-sm text-destructive mt-1.5 ml-1">{error}</p>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={loading || !playerTag.trim()} 
            size="default"
            className="h-11 px-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Buscar"
            )}
          </Button>
        </form>
      </div>

      {}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {playerData && !loading && (
        <PlayerDetailsContent playerData={playerData} />
      )}
    </div>
  );
}

export default function PlayerSearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <PlayerSearchContent />
    </Suspense>
  );
}
