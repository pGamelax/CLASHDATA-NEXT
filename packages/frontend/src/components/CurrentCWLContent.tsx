"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getCurrentCWL, getCWLWar, type CurrentCWLAnalysis, type CWLPlayerPerformance } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Star, Clock, Users, Shield, Swords, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CWLTownHallsDialog } from "@/components/CWLTownHallsDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
  const [showTownHallsDialog, setShowTownHallsDialog] = useState(false);
  const [showRankingSheet, setShowRankingSheet] = useState(false);

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

  // Função para carregar guerra da rodada
  const loadWarForRound = useCallback(async (skipLoading = false) => {
    if (!analysis || !selectedRound) return;

    if (selectedRound === analysis.currentRound) {
      // Se for a rodada atual, atualiza com dados mais recentes
      try {
        const data = await getCurrentCWL(clanTag);
        setAnalysis(data);
        setSelectedWar(data.currentWar || null);
      } catch (err) {
        console.error("Erro ao atualizar guerra atual:", err);
      }
      return;
    }

    if (!skipLoading) {
      setIsLoadingWar(true);
    }

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
                if (!skipLoading) {
                  setIsLoadingWar(false);
                }
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
      if (!skipLoading) {
        setIsLoadingWar(false);
      }
    }
  }, [analysis, selectedRound, clanTag]);

  // Carrega guerra quando a rodada é alterada
  useEffect(() => {
    if (selectedRound && analysis) {
      loadWarForRound();
    }
  }, [selectedRound, analysis, loadWarForRound]);

  // Polling para atualizar dados em tempo real quando a guerra está em andamento
  useEffect(() => {
    if (!selectedWar || selectedWar.state !== "inWar") {
      return;
    }

    // Atualiza a cada 30 segundos quando a guerra está em andamento
    const interval = setInterval(() => {
      // Atualiza o CWL completo para pegar standings atualizados
      const refreshData = async () => {
        try {
          const data = await getCurrentCWL(clanTag);
          setAnalysis(data);
          
          // Se for a rodada atual, atualiza a guerra também
          if (selectedRound === data.currentRound) {
            setSelectedWar(data.currentWar || null);
          } else {
            // Se for outra rodada, recarrega a guerra dessa rodada
            loadWarForRound(true);
          }
        } catch (err) {
          console.error("Erro ao atualizar dados em tempo real:", err);
        }
      };
      
      refreshData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [selectedWar?.state, selectedRound, clanTag, loadWarForRound]);

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

  // Cria ranking de clans com total de estrelas, ordenado do primeiro para o último
  // IMPORTANTE: Este hook deve ser chamado ANTES de qualquer early return
  const clansRanking = useMemo(() => {
    if (!analysis || !analysis.group) {
      return [];
    }

    const { group, standings } = analysis;

    if (standings && standings.length > 0) {
      // Usa standings se disponível (já tem estrelas)
      return standings
        .map((standing) => {
          const clan = group.clans.find((c) => c.tag === standing.clan.tag);
          if (!clan) return null;
          return {
            ...clan,
            totalStars: standing.stars,
            wins: standing.wins,
            losses: standing.losses,
            destructionPercentage: standing.destructionPercentage,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => {
          // Ordena por estrelas (maior primeiro), depois por destruição, depois por vitórias
          if (b.totalStars !== a.totalStars) {
            return b.totalStars - a.totalStars;
          }
          if (b.destructionPercentage !== a.destructionPercentage) {
            return b.destructionPercentage - a.destructionPercentage;
          }
          return b.wins - a.wins;
        });
    }
    // Se não houver standings, retorna clans sem ordenação (ordem original)
    return group.clans.map((clan) => ({
      ...clan,
      totalStars: 0,
      wins: 0,
      losses: 0,
      destructionPercentage: 0,
    }));
  }, [analysis]);

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
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">CWL Atual</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Temporada {group.season} • {group.clans.length} clans • {group.rounds.length} rodadas
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="default"
              size="lg"
              onClick={() => setShowTownHallsDialog(true)}
              className="gap-2 w-full sm:w-auto"
            >
              <Building2 className="h-5 w-5" />
              Ver CVs Cadastrados
            </Button>
            <Select
              value={selectedRound?.toString() || ""}
              onValueChange={(value) => setSelectedRound(parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
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
        </div>

      </div>

      {/* Ranking e Guerra Atual - Lado a Lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ranking de Clans - Desktop */}
        <Card className="hidden lg:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4" />
              Ranking de Clans ({clansRanking.length} clans)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {clansRanking.map((clan, index) => {
                const isCurrentClan = clan.tag === (clanTag.startsWith("#") ? clanTag : `#${clanTag}`);
                return (
                  <div
                    key={clan.tag}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2 border rounded-md text-xs",
                      isCurrentClan
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-muted-foreground font-mono w-6 shrink-0">
                        #{index + 1}
                      </span>
                      <img
                        src={clan.badgeUrls.small}
                        alt={clan.name}
                        className="w-5 h-5 shrink-0"
                      />
                      <span className="font-medium truncate">{clan.name}</span>
                      {isCurrentClan && (
                        <Badge variant="default" className="text-xs px-1 py-0 shrink-0">Você</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="font-semibold">{clan.totalStars}</span>
                      </div>
                      {clan.wins > 0 || clan.losses > 0 ? (
                        <span className="text-muted-foreground">
                          {clan.wins}W - {clan.losses}L
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Botão para abrir ranking no mobile */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowRankingSheet(true)}
          >
            <Star className="h-4 w-4" />
            Ver Ranking de Clans ({clansRanking.length} clans)
          </Button>
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
                {/* Comparação de Clans - Compacto e Responsivo */}
                <div className="space-y-3">
                  {/* Nomes: logo - nome x nome - logo */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img
                        src={selectedWar.clan.badgeUrls.small}
                        alt={selectedWar.clan.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 shrink-0"
                      />
                      <span className="font-semibold text-xs sm:text-sm truncate">{selectedWar.clan.name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0">x</span>
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <span className="font-semibold text-xs sm:text-sm truncate text-right">{selectedWar.opponent.name}</span>
                      <img
                        src={selectedWar.opponent.badgeUrls.small}
                        alt={selectedWar.opponent.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 shrink-0"
                      />
                    </div>
                  </div>

                  {/* Estrelas: stars x stars */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 flex-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                      <span className="font-bold text-base sm:text-lg">{selectedWar.clan.stars}</span>
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0">x</span>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="font-bold text-base sm:text-lg">{selectedWar.opponent.stars}</span>
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                    </div>
                  </div>

                  {/* Destruição: destruction x destruction */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Destruição</span>
                      <span className="font-semibold text-xs sm:text-sm">{selectedWar.clan.destructionPercentage.toFixed(1)}%</span>
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0">x</span>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end min-w-0">
                      <span className="font-semibold text-xs sm:text-sm">{selectedWar.opponent.destructionPercentage.toFixed(1)}%</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Destruição</span>
                    </div>
                  </div>

                  {/* Ataques: ataques x ataques */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Ataques</span>
                      <span className="font-semibold text-xs sm:text-sm">{selectedWar.clan.attacks}</span>
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0">x</span>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end min-w-0">
                      <span className="font-semibold text-xs sm:text-sm">{selectedWar.opponent.attacks}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Ataques</span>
                    </div>
                  </div>

                  {/* Início e Fim */}
                  {selectedWar.startTime && (
                    <div className="pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-muted-foreground">Início</p>
                          <p className="font-medium text-xs sm:text-sm">{formatDate(selectedWar.startTime)}</p>
                        </div>
                      </div>
                      {selectedWar.endTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-muted-foreground">Fim</p>
                            <p className="font-medium text-xs sm:text-sm">{formatDate(selectedWar.endTime)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
      </div>

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
            {timeline.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum ataque registrado ainda
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ataques do Nosso Clan */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Swords className="h-4 w-4 text-primary" />
                      Nosso Clan ({timeline.filter((e) => e.isClanAttack).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                      {timeline
                        .filter((event) => event.isClanAttack)
                        .map((event, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-2 rounded-md border text-xs transition-colors",
                              event.stars === 3
                                ? "bg-primary/10 border-primary/30"
                                : "bg-muted/30 border-border hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                  #{event.order}
                                </span>
                                <span className="font-medium truncate">{event.attackerName}</span>
                                <span className="text-muted-foreground shrink-0">→</span>
                                <span className="text-xs truncate text-muted-foreground">{event.defenderName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge 
                                  variant={event.stars === 3 ? "default" : "secondary"} 
                                  className="text-[10px] px-1.5 py-0 h-4"
                                >
                                  {event.stars}⭐
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{event.destructionPercentage}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{event.clanStarsAfter}⭐</span>
                              <span className="text-muted-foreground/50">vs</span>
                              <span>{event.opponentStarsAfter}⭐</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Ataques do Oponente */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Oponente ({timeline.filter((e) => !e.isClanAttack).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                      {timeline
                        .filter((event) => !event.isClanAttack)
                        .map((event, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-2 rounded-md border text-xs transition-colors",
                              event.stars === 3
                                ? "bg-primary/5 border-primary/20"
                                : "bg-muted/30 border-border hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                  #{event.order}
                                </span>
                                <span className="font-medium truncate">{event.attackerName}</span>
                                <span className="text-muted-foreground shrink-0">→</span>
                                <span className="text-xs truncate text-muted-foreground">{event.defenderName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge 
                                  variant={event.stars === 3 ? "default" : "secondary"} 
                                  className="text-[10px] px-1.5 py-0 h-4"
                                >
                                  {event.stars}⭐
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{event.destructionPercentage}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{event.clanStarsAfter}⭐</span>
                              <span className="text-muted-foreground/50">vs</span>
                              <span>{event.opponentStarsAfter}⭐</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab 3 Estrelas */}
          <TabsContent value="three-stars" className="space-y-4 mt-4">
            {threeStarAttacks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum ataque de 3 estrelas ainda
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ataques do Nosso Clan */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Swords className="h-4 w-4 text-primary" />
                      Nosso Clan ({threeStarAttacks.filter((a) => a.isClanAttack).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {threeStarAttacks.filter((attack) => attack.isClanAttack).length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        Nenhum ataque de 3 estrelas
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                        {threeStarAttacks
                          .filter((attack) => attack.isClanAttack)
                          .map((attack, index) => (
                            <div
                              key={index}
                              className="p-2 rounded-md border bg-primary/10 border-primary/30 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                    #{attack.order}
                                  </span>
                                  <span className="font-medium truncate">{attack.attackerName}</span>
                                  <span className="text-muted-foreground shrink-0">→</span>
                                  <span className="text-xs truncate text-muted-foreground">{attack.defenderName}</span>
                                </div>
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                  3⭐ 100%
                                </Badge>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {attack.duration}s
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ataques do Oponente */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Oponente ({threeStarAttacks.filter((a) => !a.isClanAttack).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {threeStarAttacks.filter((attack) => !attack.isClanAttack).length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        Nenhum ataque de 3 estrelas
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                        {threeStarAttacks
                          .filter((attack) => !attack.isClanAttack)
                          .map((attack, index) => (
                            <div
                              key={index}
                              className="p-2 rounded-md border bg-muted/30 border-border text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                    #{attack.order}
                                  </span>
                                  <span className="font-medium truncate">{attack.attackerName}</span>
                                  <span className="text-muted-foreground shrink-0">→</span>
                                  <span className="text-xs truncate text-muted-foreground">{attack.defenderName}</span>
                                </div>
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                  3⭐ 100%
                                </Badge>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {attack.duration}s
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab Performance */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Ranking de Performance
                </CardTitle>
                <CardDescription className="text-xs">
                  Score de eficiência (média bayesiana) - Temporada Inteira
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!analysis?.seasonPerformance || analysis.seasonPerformance.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum dado de performance disponível ainda
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                    {analysis.seasonPerformance.map((player: CWLPlayerPerformance, index: number) => {
                      const percentage = (player.performanceScore / 3.0) * 100;
                      return (
                        <div
                          key={player.tag}
                          className={cn(
                            "p-2.5 rounded-md border transition-colors",
                            index < 3
                              ? "bg-primary/10 border-primary/30"
                              : "bg-muted/30 border-border hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-[10px] font-mono text-muted-foreground w-6 shrink-0">
                                #{index + 1}
                              </span>
                              <span className="font-semibold text-xs sm:text-sm truncate">{player.name}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="font-bold text-xs sm:text-sm">{player.performanceScore.toFixed(2)}</span>
                              <span className="text-[10px] text-muted-foreground">pts</span>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-1 mb-1.5 bg-primary/20 [&>div]:bg-primary" />
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                            <span>{player.totalAttacks} ataques</span>
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {player.totalStars}
                            </span>
                            <span>{player.warsParticipated} guerras</span>
                            {player.perfectAttacks > 0 && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                {player.perfectAttacks} PT
                              </Badge>
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

      {/* Dialog de Town Halls */}
      <CWLTownHallsDialog
        open={showTownHallsDialog}
        onOpenChange={setShowTownHallsDialog}
        clanTag={clanTag}
      />

      {/* Sheet de Ranking para Mobile */}
      <Sheet open={showRankingSheet} onOpenChange={setShowRankingSheet}>
        <SheetContent side="bottom" className="h-[90vh] overflow-hidden flex flex-col p-0">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
            <SheetTitle className="text-base sm:text-lg flex items-center gap-2">
              <Star className="h-4 w-4 sm:h-5 sm:w-5" />
              Ranking de Clans ({clansRanking.length} clans)
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-auto flex-1 px-4 sm:px-6 py-3 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              {clansRanking.map((clan, index) => {
                const isCurrentClan = clan.tag === (clanTag.startsWith("#") ? clanTag : `#${clanTag}`);
                return (
                  <div
                    key={clan.tag}
                    className={cn(
                      "flex items-center justify-between gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 border rounded-md text-xs sm:text-sm",
                      isCurrentClan
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <span className="text-muted-foreground font-mono w-6 sm:w-7 shrink-0 text-[10px] sm:text-xs">
                        #{index + 1}
                      </span>
                      <img
                        src={clan.badgeUrls.small}
                        alt={clan.name}
                        className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-xs sm:text-sm truncate leading-tight">{clan.name}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground truncate leading-tight">{clan.tag}</span>
                      </div>
                      {isCurrentClan && (
                        <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 shrink-0">Você</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                        <span className="font-semibold text-sm sm:text-base">{clan.totalStars}</span>
                      </div>
                      {clan.wins > 0 || clan.losses > 0 ? (
                        <span className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
                          {clan.wins}W-{clan.losses}L
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
