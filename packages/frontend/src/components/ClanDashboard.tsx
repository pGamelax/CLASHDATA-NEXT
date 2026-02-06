"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Trophy, Users, MapPin, Shield, TrendingUp, Target } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ClanDashboardProps {
  organization: any;
  clan: any;
  clanData: any;
}

export function ClanDashboard({ organization, clan, clanData }: ClanDashboardProps) {
  // Usa dados da API se disponível, senão usa dados do banco
  const displayData = clanData || {
    name: clan.name,
    tag: clan.clanTag || clan.tag,
    description: clan.description,
    badgeUrls: clan.metadata?.badgeUrls || clan.badgeUrls,
    clanLevel: clan.clanLevel || clan.metadata?.clanLevel,
    clanPoints: clan.clanPoints || clan.metadata?.clanPoints,
    members: clan.members || clan.metadata?.members,
    location: clan.metadata?.location,
    warFrequency: clan.metadata?.warFrequency,
    warWins: clan.metadata?.warWins,
    warLosses: clan.metadata?.warLosses,
    warTies: clan.metadata?.warTies,
    warWinStreak: clan.metadata?.warWinStreak,
    requiredTrophies: clan.metadata?.requiredTrophies,
  };

  const clanSlug = (clan.clanTag || clan.tag).replace("#", "").toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header do Clan */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {displayData.badgeUrls?.large && (
            <Image
              src={displayData.badgeUrls.large}
              alt={displayData.name}
              width={80}
              height={80}
              className="object-contain"
              unoptimized
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{displayData.name}</h1>
            <p className="text-muted-foreground font-mono">{displayData.tag}</p>
            {displayData.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                {displayData.description}
              </p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/org/${organization.slug}/${clanSlug}/wars`}>
            <Swords className="h-4 w-4 mr-2" />
            Ver Wars
          </Link>
        </Button>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível do Clan</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData.clanLevel || "N/A"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos do Clan</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayData.clanPoints?.toLocaleString() || "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayData.members || 0}/50
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localização</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {displayData.location?.name || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações de Guerra */}
      {(displayData.warWins !== undefined || displayData.warLosses !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Estatísticas de Guerra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {displayData.warWins !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Vitórias</p>
                  <p className="text-2xl font-bold text-green-600">{displayData.warWins}</p>
                </div>
              )}
              {displayData.warLosses !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Derrotas</p>
                  <p className="text-2xl font-bold text-red-600">{displayData.warLosses}</p>
                </div>
              )}
              {displayData.warTies !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Empates</p>
                  <p className="text-2xl font-bold text-yellow-600">{displayData.warTies}</p>
                </div>
              )}
              {displayData.warWinStreak !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Sequência de Vitórias</p>
                  <p className="text-2xl font-bold text-primary">{displayData.warWinStreak}</p>
                </div>
              )}
            </div>
            {displayData.warFrequency && (
              <div className="mt-4">
                <Badge variant="outline">{displayData.warFrequency}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      <div className="grid gap-4 md:grid-cols-2">
        {displayData.requiredTrophies !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Troféus Necessários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayData.requiredTrophies.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/org/${organization.slug}/${clanSlug}/wars`}>
                <Swords className="h-4 w-4 mr-2" />
                Ver Ranking de Guerras
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

