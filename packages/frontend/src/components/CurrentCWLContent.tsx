"use client";

import { useState, useEffect, useMemo } from "react";
import { getCurrentCWL, getCWLWar, type CurrentCWLAnalysis, type CWLPlayerPerformance } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trophy, Clock, Users, Shield, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentCWLContentProps {
  clanTag: string;
}

export function CurrentCWLContent({ clanTag }: CurrentCWLContentProps) {
  const [analysis, setAnalysis] = useState<CurrentCWLAnalysis | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedWar, setSelectedWar] = useState<CurrentCWLAnalysis["currentWar"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWar, setIsLoadingWar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentCWL = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCurrentCWL(clanTag);
        setAnalysis(data);
        // Define a rodada atual como selecionada por padrão
        if (data.currentRound) {
          setSelectedRound(data.currentRound);
          setSelectedWar(data.currentWar || null);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar CWL atual");
      } finally {
        setIsLoading(false);
      }
    };

    if (clanTag) {
      loadCurrentCWL();
    }
  }, [clanTag]);

  // Carrega guerra quando a rodada é alterada
  useEffect(() => {
    const loadWarForRound = async () => {
      if (!analysis || !selectedRound || selectedRound === analysis.currentRound) {
        // Se for a rodada atual, usa a guerra já carregada
        setSelectedWar(analysis?.currentWar || null);
        return;
      }

      setIsLoadingWar(true);
      try {
        // Encontra a guerra do clan na rodada selecionada
        const round = analysis.group.rounds[selectedRound - 1];
        const clanTagToFind = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
        
        // Procura a guerra que contém nosso clan
        for (const warTag of round.warTags) {
          if (warTag && warTag !== "#0") {
            try {
              const war = await getCWLWar(warTag);
              // Verifica se a guerra tem clan e opponent antes de acessar
              if (war?.clan && war?.opponent) {
                if (war.clan.tag === clanTagToFind || war.opponent.tag === clanTagToFind) {
                  setSelectedWar(war);
                  setIsLoadingWar(false);
                  return;
                }
              }
            } catch (error) {
              continue;
            }
          }
        }
        setSelectedWar(null);
      } catch (err: any) {
        console.error("Erro ao carregar guerra da rodada:", err);
        setSelectedWar(null);
      } finally {
        setIsLoadingWar(false);
      }
    };

    if (selectedRound && analysis) {
      loadWarForRound();
    }
  }, [selectedRound, analysis, clanTag]);

  // Processa timeline e ataques de 3 estrelas da guerra selecionada
  // IMPORTANTE: Este hook deve ser chamado ANTES de qualquer early return
  const { timeline, threeStarAttacks } = useMemo(() => {
    if (!selectedWar || !selectedWar.clan || !selectedWar.opponent) {
      return { timeline: [], threeStarAttacks: [] };
    }

    const timelineEvents: Array<{
      attackerName: string;
      defenderName: string;
      stars: number;
      destructionPercentage: number;
      order: number;
      duration: number;
      isClanAttack: boolean;
      clanStarsAfter: number;
      opponentStarsAfter: number;
    }> = [];

    // Processa ataques do nosso clan
    const clanMembers = selectedWar.clan.members || [];
    clanMembers.forEach((member) => {
      if (member.attacks) {
        member.attacks.forEach((attack) => {
          const defender = selectedWar.opponent.members.find(
            (m) => m.tag === attack.defenderTag
          );
          timelineEvents.push({
            attackerName: member.name,
            defenderName: defender?.name || "Desconhecido",
            stars: attack.stars,
            destructionPercentage: attack.destructionPercentage,
            order: attack.order,
            duration: attack.duration,
            isClanAttack: true,
            clanStarsAfter: 0,
            opponentStarsAfter: 0,
          });
        });
      }
    });

    // Processa ataques do oponente
    const opponentMembers = selectedWar.opponent.members || [];
    opponentMembers.forEach((member) => {
      if (member.attacks) {
        member.attacks.forEach((attack) => {
          const defender = selectedWar.clan.members.find(
            (m) => m.tag === attack.defenderTag
          );
          timelineEvents.push({
            attackerName: member.name,
            defenderName: defender?.name || "Desconhecido",
            stars: attack.stars,
            destructionPercentage: attack.destructionPercentage,
            order: attack.order,
            duration: attack.duration,
            isClanAttack: false,
            clanStarsAfter: 0,
            opponentStarsAfter: 0,
          });
        });
      }
    });

    // Ordena por ordem do ataque
    timelineEvents.sort((a, b) => a.order - b.order);

    // Calcula estrelas acumuladas após cada ataque
    let clanStars = 0;
    let opponentStars = 0;
    timelineEvents.forEach((event) => {
      if (event.isClanAttack) {
        clanStars += event.stars;
      } else {
        opponentStars += event.stars;
      }
      event.clanStarsAfter = clanStars;
      event.opponentStarsAfter = opponentStars;
    });

    // Filtra ataques de 3 estrelas
    const threeStars = timelineEvents.filter(
      (event) => event.stars === 3 && event.destructionPercentage === 100
    );

    return {
      timeline: timelineEvents,
      threeStarAttacks: threeStars,
    };
  }, [selectedWar]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
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

  if (!analysis || !analysis.group) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            O clan não está participando de CWL no momento
          </div>
        </CardContent>
      </Card>
    );
  }

  const { group, currentRound, clanPosition } = analysis;
  const currentClan = group.clans.find(
    (c) => c.tag === (clanTag.startsWith("#") ? clanTag : `#${clanTag}`)
  );

  // Formata data
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

  return (
    <div className="space-y-6">
      {/* Header Simples */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CWL Atual</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Temporada {group.season} • {group.clans.length} clans • {group.rounds.length} rodadas
            </p>
          </div>
          <Select
            value={selectedRound?.toString() || ""}
            onValueChange={(value) => setSelectedRound(parseInt(value))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione a rodada" />
            </SelectTrigger>
            <SelectContent>
              {group.rounds.map((round, index) => {
                const roundNumber = index + 1;
                const activeWars = round.warTags.filter((tag) => tag !== "#0");
                return (
                  <SelectItem
                    key={roundNumber}
                    value={roundNumber.toString()}
                    disabled={activeWars.length === 0}
                  >
                    Rodada {roundNumber}
                    {roundNumber === currentRound && " (Atual)"}
                    {activeWars.length === 0 && " (Não iniciada)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Grupo - Compacto */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Grupo ({group.clans.length} clans)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {group.clans.map((clan, index) => {
                const isCurrentClan = clan.tag === (clanTag.startsWith("#") ? clanTag : `#${clanTag}`);
                return (
                  <div
                    key={clan.tag}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 border rounded-md text-xs",
                      isCurrentClan
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    )}
                  >
                    <img
                      src={clan.badgeUrls.small}
                      alt={clan.name}
                      className="w-5 h-5"
                    />
                    <span className="font-medium truncate max-w-[120px]">{clan.name}</span>
                    {isCurrentClan && (
                      <Badge variant="default" className="text-xs px-1 py-0">Você</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guerra Atual */}
      {isLoadingWar ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      ) : selectedWar ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rodada {selectedRound}</CardTitle>
                <CardDescription>
                  {selectedRound === currentRound ? "Rodada Atual" : `Rodada ${selectedRound}`}
                </CardDescription>
              </div>
              <Badge variant={selectedWar.state === "inWar" ? "default" : "secondary"}>
                {selectedWar.state === "inWar" ? "Em Guerra" : selectedWar.state === "preparation" ? "Preparação" : "Finalizada"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedWar.clan || !selectedWar.opponent ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Dados da guerra ainda não estão disponíveis. A guerra pode estar em preparação.
              </div>
            ) : (
              <>
                {/* Comparação de Clans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nosso Clan */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedWar.clan.badgeUrls.small}
                        alt={selectedWar.clan.name}
                        className="w-10 h-10"
                      />
                      <div>
                        <p className="font-semibold">{selectedWar.clan.name}</p>
                        <p className="text-xs text-muted-foreground">Nível {selectedWar.clan.clanLevel}</p>
                      </div>
                    </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estrelas</span>
                    <span className="text-xl font-bold flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      {selectedWar.clan.stars}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Destruição</span>
                      <span className="font-medium">{selectedWar.clan.destructionPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedWar.clan.destructionPercentage} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Ataques</span>
                    <span className="font-medium">{selectedWar.clan.attacks}</span>
                  </div>
                </div>
              </div>

              {/* Oponente */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedWar.opponent.badgeUrls.small}
                    alt={selectedWar.opponent.name}
                    className="w-10 h-10"
                  />
                  <div>
                    <p className="font-semibold">{selectedWar.opponent.name}</p>
                    <p className="text-xs text-muted-foreground">Nível {selectedWar.opponent.clanLevel}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estrelas</span>
                    <span className="text-xl font-bold flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      {selectedWar.opponent.stars}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Destruição</span>
                      <span className="font-medium">{selectedWar.opponent.destructionPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedWar.opponent.destructionPercentage} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Ataques</span>
                    <span className="font-medium">{selectedWar.opponent.attacks}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações da Guerra */}
            {selectedWar.startTime && (
              <div className="pt-4 border-t grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Início</p>
                    <p className="font-medium">{formatDate(selectedWar.startTime)}</p>
                  </div>
                </div>
                {selectedWar.endTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Fim</p>
                      <p className="font-medium">{formatDate(selectedWar.endTime)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Tamanho</p>
                    <p className="font-medium">{selectedWar.teamSize}</p>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </CardContent>
        </Card>
      ) : selectedRound && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground text-sm">
              Esta rodada ainda não foi iniciada ou não há guerra disponível
            </div>
          </CardContent>
        </Card>
      )}


      {/* Tabs - Timeline, 3 Estrelas e Performance */}
      {selectedWar && selectedWar.clan && selectedWar.opponent && (
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3 overflow-x-auto scrollbar-hide">
            <TabsTrigger value="timeline" className="text-xs sm:text-sm whitespace-nowrap">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="three-stars" className="text-xs sm:text-sm whitespace-nowrap">
              3 Estrelas
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm whitespace-nowrap">
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Tab Timeline */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline da Guerra</CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum ataque registrado ainda
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                    {/* Ataques do Nosso Clan */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Swords className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Nosso Clan</span>
                      </div>
                      {timeline
                        .filter((event) => event.isClanAttack)
                        .map((event, index) => (
                          <div
                            key={index}
                            className="p-2.5 rounded-lg border bg-primary/5 border-primary/20 text-sm"
                          >
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-xs">{event.attackerName}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-xs truncate">{event.defenderName}</span>
                              <Badge variant={event.stars === 3 ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                                {event.stars}⭐
                              </Badge>
                              <span className="text-xs text-muted-foreground">{event.destructionPercentage}%</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">#{event.order}</span>
                              <span>{event.clanStarsAfter}⭐ vs {event.opponentStarsAfter}⭐</span>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Ataques do Oponente */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">Oponente</span>
                      </div>
                      {timeline
                        .filter((event) => !event.isClanAttack)
                        .map((event, index) => (
                          <div
                            key={index}
                            className="p-2.5 rounded-lg border bg-muted/30 border-border text-sm"
                          >
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-xs">{event.attackerName}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-xs truncate">{event.defenderName}</span>
                              <Badge variant={event.stars === 3 ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                                {event.stars}⭐
                              </Badge>
                              <span className="text-xs text-muted-foreground">{event.destructionPercentage}%</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">#{event.order}</span>
                              <span>{event.clanStarsAfter}⭐ vs {event.opponentStarsAfter}⭐</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3 Estrelas */}
          <TabsContent value="three-stars" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ataques de 3 Estrelas</CardTitle>
              </CardHeader>
              <CardContent>
                {threeStarAttacks.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum ataque de 3 estrelas ainda
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                    {/* Ataques do Nosso Clan */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Swords className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Nosso Clan</span>
                      </div>
                      {threeStarAttacks
                        .filter((attack) => attack.isClanAttack)
                        .map((attack, index) => (
                          <div
                            key={index}
                            className="p-2.5 rounded-lg border bg-primary/5 border-primary/20 text-sm"
                          >
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-xs">{attack.attackerName}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-xs truncate">{attack.defenderName}</span>
                              <Badge variant="default" className="text-xs px-1.5 py-0">3⭐ 100%</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">#{attack.order}</span>
                              <span>{attack.duration}s</span>
                            </div>
                          </div>
                        ))}
                      {threeStarAttacks.filter((attack) => attack.isClanAttack).length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4">
                          Nenhum ataque de 3 estrelas do nosso clan
                        </p>
                      )}
                    </div>

                    {/* Ataques do Oponente */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">Oponente</span>
                      </div>
                      {threeStarAttacks
                        .filter((attack) => !attack.isClanAttack)
                        .map((attack, index) => (
                          <div
                            key={index}
                            className="p-2.5 rounded-lg border bg-muted/30 border-border text-sm"
                          >
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-xs">{attack.attackerName}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-xs truncate">{attack.defenderName}</span>
                              <Badge variant="default" className="text-xs px-1.5 py-0">3⭐ 100%</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">#{attack.order}</span>
                              <span>{attack.duration}s</span>
                            </div>
                          </div>
                        ))}
                      {threeStarAttacks.filter((attack) => !attack.isClanAttack).length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4">
                          Nenhum ataque de 3 estrelas do oponente
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Performance */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Ranking de Performance - Temporada Inteira
                </CardTitle>
                <CardDescription>
                  Membros ordenados por score de eficiência (média bayesiana) de todas as rodadas da temporada
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!analysis?.seasonPerformance || analysis.seasonPerformance.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum dado de performance disponível ainda
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {analysis.seasonPerformance.map((player: CWLPlayerPerformance, index: number) => {
                      const percentage = (player.performanceScore / 3.0) * 100;
                      return (
                        <div
                          key={player.tag}
                          className="p-3 rounded-lg border bg-primary/5 border-primary/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">
                                #{index + 1}
                              </span>
                              <span className="font-semibold text-sm">{player.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-sm">{player.performanceScore.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground">pts</span>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-1.5 mb-2 bg-primary/20 [&>div]:bg-primary" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{player.totalAttacks} ataques</span>
                            <span>{player.totalStars}⭐</span>
                            <span>{player.warsParticipated} guerras</span>
                            {player.perfectAttacks > 0 && (
                              <span className="text-yellow-600 font-semibold">
                                {player.perfectAttacks} PT
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
