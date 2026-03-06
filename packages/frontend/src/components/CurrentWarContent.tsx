"use client";

import { useState, useEffect } from "react";
import { getCurrentWar, type CurrentWarAnalysis } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, Target, Clock, Users, Zap, Shield, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentWarContentProps {
  clanTag: string;
}

export function CurrentWarContent({ clanTag }: CurrentWarContentProps) {
  const [analysis, setAnalysis] = useState<CurrentWarAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentWar = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCurrentWar(clanTag);
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar guerra atual");
      } finally {
        setIsLoading(false);
      }
    };

    if (clanTag) {
      loadCurrentWar();
    }
  }, [clanTag]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || !analysis.war.clan || !analysis.war.opponent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            O clan não está em guerra no momento
          </div>
        </CardContent>
      </Card>
    );
  }

  const { war, prediction, warStatus, warCloser, threeStarAttacks, timeline } = analysis;
  const { clan, opponent } = war;
  if (!clan || !opponent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Dados incompletos da guerra
          </div>
        </CardContent>
      </Card>
    );
  }
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      const hour = dateString.substring(9, 11);
      const minute = dateString.substring(11, 13);
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "winning":
      case "won":
        return "default"; // Verde/sucesso
      case "losing":
      case "lost":
        return "destructive"; // Vermelho
      case "tied":
      case "tie":
        return "secondary"; // Cinza
      case "preparation":
        return "outline"; // Outline
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      {}
      <div className="flex justify-center">
        <Badge 
          variant={getStatusBadgeVariant(warStatus.status)} 
          className="text-lg px-6 py-2"
        >
          {warStatus.label}
        </Badge>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <img
                src={clan.badgeUrls.small}
                alt={clan.name}
                className="w-12 h-12"
              />
              <div>
                <CardTitle className="text-lg">{clan.name}</CardTitle>
                <CardDescription>Nível {clan.clanLevel}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estrelas</span>
              <span className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {clan.stars}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Destruição</span>
                <span className="font-semibold">{clan.destructionPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={clan.destructionPercentage} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ataques</span>
              <span className="font-semibold">{clan.attacks}</span>
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <img
                src={opponent.badgeUrls.small}
                alt={opponent.name}
                className="w-12 h-12"
              />
              <div>
                <CardTitle className="text-lg">{opponent.name}</CardTitle>
                <CardDescription>Nível {opponent.clanLevel}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estrelas</span>
              <span className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {opponent.stars}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Destruição</span>
                <span className="font-semibold">{opponent.destructionPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={opponent.destructionPercentage} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ataques</span>
              <span className="font-semibold">{opponent.attacks}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      {warCloser && (
        <Card className={cn(
          "border-2",
          warCloser.isClanAttack 
            ? "border-primary bg-primary/5" 
            : "border-destructive bg-destructive/5"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Zap className="h-5 w-5 text-yellow-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Fechou a guerra:</span>
                    <span className="font-bold text-lg">{warCloser.attackerName}</span>
                    <Badge 
                      variant={warCloser.isClanAttack ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {warCloser.isClanAttack ? "Nosso Clan" : "Oponente"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>→ {warCloser.defenderName}</span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-yellow-500" />
                      {warCloser.stars}⭐ {warCloser.destructionPercentage}%
                    </span>
                    <span>#{warCloser.order}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Previsão de Vitória
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nosso Clan</span>
              <span className="font-semibold">{prediction.clanWinProbability}%</span>
            </div>
            <Progress value={prediction.clanWinProbability} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Oponente</span>
              <span className="font-semibold">{prediction.opponentWinProbability}%</span>
            </div>
            <Progress value={prediction.opponentWinProbability} className="h-2" />
          </div>
          {prediction.tieProbability > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Empate</span>
                <span className="font-semibold">{prediction.tieProbability}%</span>
              </div>
              <Progress value={prediction.tieProbability} className="h-2" />
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">{prediction.reasoning}</p>
        </CardContent>
      </Card>

      {}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
          <TabsTrigger value="three-stars" className="text-xs sm:text-sm">3 Estrelas</TabsTrigger>
        </TabsList>

        {}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Guerra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tamanho</p>
                    <p className="font-semibold">{war.teamSize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ataques/Membro</p>
                    <p className="font-semibold">{war.attacksPerMember}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-semibold text-xs">{formatDate(war.startTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fim</p>
                    <p className="font-semibold text-xs">{formatDate(war.endTime)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Badge variant="outline">Estado: {war.state}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline da Guerra</CardTitle>
              <CardDescription>
                Todos os ataques em ordem cronológica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {timeline.map((event, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border",
                      event.isClanAttack
                        ? "bg-primary/5 border-primary/20"
                        : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <div className="shrink-0">
                      {event.isClanAttack ? (
                        <Swords className="h-5 w-5 text-primary" />
                      ) : (
                        <Shield className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{event.attackerName}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{event.defenderName}</span>
                        <Badge variant={event.stars === 3 ? "default" : "secondary"}>
                          {event.stars}⭐
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {event.destructionPercentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>#{event.order}</span>
                        <span>
                          Nosso Clan: {event.clanStarsAfter} ⭐ | Oponente: {event.opponentStarsAfter} ⭐
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {}
        <TabsContent value="three-stars" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ataques de 3 Estrelas</CardTitle>
              <CardDescription>
                Todos os ataques perfeitos (3 estrelas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {threeStarAttacks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum ataque de 3 estrelas ainda
                  </p>
                ) : (
                  threeStarAttacks.map((attack, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg border",
                        attack.isClanAttack
                          ? "bg-primary/5 border-primary/20"
                          : "bg-destructive/5 border-destructive/20"
                      )}
                    >
                      <div className="shrink-0">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{attack.attackerName}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{attack.defenderName}</span>
                          <Badge variant="default">3⭐ 100%</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>#{attack.order}</span>
                          <span>Duração: {attack.duration}s</span>
                          <Badge variant={attack.isClanAttack ? "default" : "destructive"} className="text-xs">
                            {attack.isClanAttack ? "Nosso Clan" : "Oponente"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

