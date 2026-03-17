"use client";

import { type CurrentWarAnalysis } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Clock, Users, Swords, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentWarContentProps {
  analysis: CurrentWarAnalysis;
  clanName: string;
}

const STATUS_CONFIG: Record<
  string,
  { className: string }
> = {
  winning: { className: "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30" },
  won:     { className: "bg-green-600/15 text-green-700 dark:text-green-400 border border-green-600/30" },
  losing:  { className: "bg-destructive/15 text-destructive border border-destructive/30" },
  lost:    { className: "bg-destructive/15 text-destructive border border-destructive/30" },
  tied:    { className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30" },
  tie:     { className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30" },
  preparation: { className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30" },
  notInWar:    { className: "bg-muted text-muted-foreground" },
};

function formatDate(dateString?: string) {
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
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StarBadge({ stars }: { stars: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-semibold">
      {"⭐".repeat(stars)}
      {stars === 0 && <span className="text-muted-foreground text-xs">0⭐</span>}
    </span>
  );
}

export function CurrentWarContent({ analysis, clanName }: CurrentWarContentProps) {
  const { war, prediction, warStatus, warCloser, threeStarAttacks, timeline } = analysis;
  const { clan, opponent } = war;

  if (!clan || !opponent) return null;

  const statusCfg = STATUS_CONFIG[warStatus.status] ?? STATUS_CONFIG.notInWar;
  const totalAttacks = (war.teamSize ?? 0) * (war.attacksPerMember ?? 2);

  return (
    <div className="space-y-6">
      {/* Status + war header */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold",
                statusCfg.className
              )}
            >
              {warStatus.label}
            </span>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {war.teamSize}v{war.teamSize}
              </span>
              <span className="flex items-center gap-1">
                <Swords className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {war.attacksPerMember} ataques/membro
              </span>
            </div>
          </div>

          {/* Clan vs Opponent */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
            {/* Our clan */}
            <div className="flex items-center gap-2 min-w-0">
              {clan.badgeUrls?.small && (
                <img src={clan.badgeUrls.small} alt={clan.name} className="w-7 h-7 sm:w-10 sm:h-10 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm truncate leading-tight">{clan.name}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">Nível {clan.clanLevel}</p>
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-0.5 px-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xl sm:text-2xl font-black tabular-nums">
                <span className={cn(clan.stars > opponent.stars ? "text-green-600" : "text-foreground")}>
                  {clan.stars}
                </span>
                <span className="text-muted-foreground text-base sm:text-lg">–</span>
                <span className={cn(opponent.stars > clan.stars ? "text-destructive" : "text-foreground")}>
                  {opponent.stars}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">estrelas</span>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-2 justify-end text-right min-w-0">
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm truncate leading-tight">{opponent.name}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">Nível {opponent.clanLevel}</p>
              </div>
              {opponent.badgeUrls?.small && (
                <img src={opponent.badgeUrls.small} alt={opponent.name} className="w-7 h-7 sm:w-10 sm:h-10 shrink-0" />
              )}
            </div>
          </div>

          {/* Destruction bars */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Destruição</span>
                <span>{clan.destructionPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={clan.destructionPercentage} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {clan.attacks}/{totalAttacks} ataques
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Destruição</span>
                <span>{opponent.destructionPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={opponent.destructionPercentage} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {opponent.attacks}/{totalAttacks} ataques
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Início: <span className="text-foreground">{formatDate(war.startTime)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Fim: <span className="text-foreground">{formatDate(war.endTime)}</span>
            </span>
          </div>
        </div>
      </Card>

      {/* War closer highlight */}
      {warCloser && (
        <Card
          className={cn(
            "border-2",
            warCloser.isClanAttack
              ? "border-green-500/40 bg-green-500/5"
              : "border-destructive/40 bg-destructive/5"
          )}
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Fechou a guerra:</span>
                  <span className="font-bold">{warCloser.attackerName}</span>
                  <Badge
                    variant={warCloser.isClanAttack ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {warCloser.isClanAttack ? "Nosso Clan" : "Oponente"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span>→ {warCloser.defenderName}</span>
                  <StarBadge stars={warCloser.stars} />
                  <span>{warCloser.destructionPercentage}%</span>
                  <span>Ataque #{warCloser.order}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Win prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Previsão de Vitória
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{clan.name}</span>
              <span className="font-semibold text-green-600">{prediction.clanWinProbability}%</span>
            </div>
            <Progress value={prediction.clanWinProbability} className="h-2" />
          </div>
          {prediction.tieProbability > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Empate</span>
                <span className="font-semibold text-yellow-600">{prediction.tieProbability}%</span>
              </div>
              <Progress value={prediction.tieProbability} className="h-2" />
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{opponent.name}</span>
              <span className="font-semibold text-destructive">{prediction.opponentWinProbability}%</span>
            </div>
            <Progress value={prediction.opponentWinProbability} className="h-2" />
          </div>
          {prediction.reasoning && (
            <p className="text-xs text-muted-foreground pt-1">{prediction.reasoning}</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="three-stars" className="text-xs sm:text-sm">
            3 Estrelas
            {threeStarAttacks.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold">
                {threeStarAttacks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Detalhes
          </TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timeline da Guerra</CardTitle>
              <CardDescription>Ataques em ordem cronológica</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum ataque registrado ainda
                </p>
              ) : (
                <div className="space-y-1.5 max-h-150 overflow-y-auto pr-1">
                  {timeline.map((event, index) => (
                    <div
                      key={index}
                      className={cn(
                        "grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 rounded-lg border",
                        event.isClanAttack
                          ? "bg-primary/5 border-primary/20"
                          : "bg-destructive/5 border-destructive/20"
                      )}
                    >
                      {/* Order number */}
                      <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                        #{event.order}
                      </span>

                      {/* Names */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{event.attackerName}</p>
                        <p className="text-xs text-muted-foreground truncate">→ {event.defenderName}</p>
                      </div>

                      {/* Result */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold leading-tight">
                          {event.stars === 0 ? "0⭐" : "⭐".repeat(event.stars)}
                        </p>
                        <p className="text-xs text-muted-foreground">{event.destructionPercentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Three stars */}
        <TabsContent value="three-stars" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ataques de 3 Estrelas</CardTitle>
              <CardDescription>Ataques perfeitos da guerra</CardDescription>
            </CardHeader>
            <CardContent>
              {threeStarAttacks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum ataque de 3 estrelas ainda
                </p>
              ) : (
                <div className="space-y-2 max-h-150 overflow-y-auto pr-1">
                  {threeStarAttacks.map((attack, index) => (
                    <div
                      key={index}
                      className={cn(
                        "grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 rounded-lg border",
                        attack.isClanAttack
                          ? "bg-primary/5 border-primary/20"
                          : "bg-destructive/5 border-destructive/20"
                      )}
                    >
                      {/* Order */}
                      <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                        #{attack.order}
                      </span>

                      {/* Names */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{attack.attackerName}</p>
                        <p className="text-xs text-muted-foreground truncate">→ {attack.defenderName}</p>
                      </div>

                      {/* Result */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold leading-tight">⭐⭐⭐</p>
                        <p className="text-xs text-muted-foreground">{formatDuration(attack.duration)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview / details */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações da Guerra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground">Tamanho</p>
                  <p className="font-semibold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {war.teamSize}v{war.teamSize}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground">Ataques/Membro</p>
                  <p className="font-semibold flex items-center gap-1.5">
                    <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                    {war.attacksPerMember}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Início
                  </p>
                  <p className="font-semibold text-sm">{formatDate(war.startTime)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Fim
                  </p>
                  <p className="font-semibold text-sm">{formatDate(war.endTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
