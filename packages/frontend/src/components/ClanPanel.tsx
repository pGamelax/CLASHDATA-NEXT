"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Trophy,
  Users,
  Shield,
  Target,
  TrendingUp,
  MapPin,
  Crown,
  Swords,
  Award,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchClanData } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { columns, type Member } from "./ClanPanel/columns";

interface ClanData {
  tag: string;
  name: string;
  type: string;
  description?: string;
  location?: {
    id: number;
    name: string;
    isCountry: boolean;
    countryCode: string;
  };
  badgeUrls?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  clanLevel: number;
  clanPoints: number;
  clanBuilderBasePoints?: number;
  clanCapitalPoints?: number;
  capitalLeague?: {
    id: number;
    name: string;
  };
  requiredTrophies?: number;
  warFrequency?: string;
  warWinStreak?: number;
  warWins?: number;
  warTies?: number;
  warLosses?: number;
  isWarLogPublic?: boolean;
  warLeague?: {
    id: number;
    name: string;
  };
  members: number;
  memberList?: Array<{
    tag: string;
    name: string;
    role: string;
    townHallLevel: number;
    expLevel: number;
    trophies: number;
    clanRank: number;
    donations: number;
    donationsReceived: number;
  }>;
}

interface ClanPanelProps {
  initialData: ClanData;
  organization: any;
}

export function ClanPanel({ initialData, organization }: ClanPanelProps) {
  const [clanData, setClanData] = useState<ClanData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Verifica cache quando o componente monta (apenas no cliente)
  useEffect(() => {
    if (!organization?.metadata?.clanTag) return;

    const checkCache = async () => {
      const clanTag = organization.metadata.clanTag.replace("#", "");
      const { getCachedClanData } = await import("@/lib/clan-cache");
      const cached = getCachedClanData(clanTag);
      
      // Se houver cache válido e os dados iniciais parecerem antigos, usa o cache
      if (cached && cached.tag === initialData.tag) {
        setClanData(cached);
      }
    };

    checkCache();
  }, [organization?.metadata?.clanTag, initialData.tag]);

  const handleRefresh = async () => {
    if (!organization?.metadata?.clanTag) return;

    setIsRefreshing(true);
    try {
      const clanTag = organization.metadata.clanTag.replace("#", "");
      // Limpa o cache antes de buscar novos dados
      const { clearClanCache } = await import("@/lib/clan-cache");
      clearClanCache(clanTag);
      // Busca dados frescos (sem usar cache)
      const freshData = await fetchClanData(clanTag, undefined, false);
      setClanData(freshData);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const winRate =
    clanData.warWins && clanData.warLosses && clanData.warTies
      ? (
          (clanData.warWins /
            (clanData.warWins + clanData.warLosses + clanData.warTies)) *
          100
        ).toFixed(1)
      : "0";

  const totalWars =
    (clanData.warWins || 0) + (clanData.warLosses || 0) + (clanData.warTies || 0);

  return (
    <div className="space-y-6">
      {/* Header do Clan */}
      <Card className="border-2">
        <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
          {clanData.badgeUrls?.large && (
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
              <Image
                src={clanData.badgeUrls.large}
                alt={`${clanData.name} badge`}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 96px, 128px"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground truncate">
                  {clanData.name}
                </h1>
                <Badge variant="secondary" className="text-xs sm:text-sm font-bold mt-1 sm:mt-0">
                  {clanData.tag}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="ml-auto shrink-0 text-xs sm:text-sm"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {clanData.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{clanData.location.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Nível {clanData.clanLevel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{clanData.members}/50</span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs sm:text-sm ${
                  clanData.type === "open"
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                }`}
              >
                {clanData.type === "open" ? "Aberto" : "Fechado"}
              </Badge>
            </div>
            {clanData.description && (
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground whitespace-pre-line line-clamp-3 sm:line-clamp-none">
                {clanData.description}
              </p>
            )}
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Pontos do Clan</span>
          </div>
            <p className="text-2xl font-bold text-foreground">
            {clanData.clanPoints.toLocaleString()}
          </p>
          </CardContent>
        </Card>

        {clanData.clanBuilderBasePoints !== undefined && (
          <Card className="border-2">
            <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground">Builder Base</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {clanData.clanBuilderBasePoints.toLocaleString()}
            </p>
            </CardContent>
          </Card>
        )}

        {clanData.clanCapitalPoints !== undefined && (
          <Card className="border-2">
            <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Capital</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {clanData.clanCapitalPoints.toLocaleString()}
            </p>
            </CardContent>
          </Card>
        )}

        {clanData.requiredTrophies !== undefined && (
          <Card className="border-2">
            <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
              <span className="text-xs text-muted-foreground">Troféus Mínimos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {clanData.requiredTrophies.toLocaleString()}
            </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estatísticas de Guerra */}
      {(clanData.warWins !== undefined ||
        clanData.warLosses !== undefined ||
        clanData.warTies !== undefined) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Swords className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle>Estatísticas de Guerra</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clanData.warWins !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Vitórias</span>
                  </div>
                  <span className="text-lg font-bold text-green-500">
                    {clanData.warWins}
                  </span>
                </div>
              )}
              {clanData.warLosses !== undefined && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    <span className="text-sm font-medium text-foreground">Derrotas</span>
                  </div>
                  <span className="text-lg font-bold text-red-500">
                    {clanData.warLosses}
                  </span>
                </div>
              )}
              {clanData.warTies !== undefined && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-foreground">Empates</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-500">
                    {clanData.warTies}
                  </span>
                </div>
              )}
              {totalWars > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Taxa de Vitória
                    </span>
                  </div>
                  <span className="text-lg font-bold text-primary">{winRate}%</span>
                </div>
              )}
              {clanData.warWinStreak !== undefined && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Swords className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Sequência de Vitórias
                    </span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {clanData.warWinStreak}
                  </span>
                </div>
              )}
              {totalWars > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Total de Guerras</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{totalWars}</span>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Ligas e Informações</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              {clanData.warLeague && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Liga de Guerra</p>
                  <p className="text-lg font-bold text-foreground">
                    {clanData.warLeague.name}
                  </p>
                </div>
              )}
              {clanData.capitalLeague && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Liga do Capital</p>
                  <p className="text-lg font-bold text-foreground">
                    {clanData.capitalLeague.name}
                  </p>
                </div>
              )}
              {clanData.warFrequency && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Frequência de Guerra
                  </p>
                  <p className="text-lg font-bold text-foreground capitalize">
                    {clanData.warFrequency === "always"
                      ? "Sempre"
                      : clanData.warFrequency === "moreThanOncePerWeek"
                        ? "Mais de uma vez por semana"
                        : clanData.warFrequency === "oncePerWeek"
                          ? "Uma vez por semana"
                          : clanData.warFrequency === "lessThanOncePerWeek"
                            ? "Menos de uma vez por semana"
                            : clanData.warFrequency === "never"
                              ? "Nunca"
                              : clanData.warFrequency}
                  </p>
                </div>
              )}
              {clanData.isWarLogPublic !== undefined && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Registro de Guerra</p>
                  <p className="text-lg font-bold text-foreground">
                    {clanData.isWarLogPublic ? "Público" : "Privado"}
                  </p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Membros */}
      {clanData.memberList && clanData.memberList.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Top Membros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={(clanData.memberList || []) as Member[]}
              searchPlaceholder="Filtrar por nome ou tag..."
              searchKeys={["name", "tag"]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

