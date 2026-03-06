"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import type { PlayerStats } from "@/lib/api";
import { columns as warHistoryColumns } from "./PlayerDetails/WarHistoryColumns";
import { columns as cwlHistoryColumns } from "./PlayerDetails/CWLHistoryColumns";
import { columns as friendlyHistoryColumns } from "./PlayerDetails/FriendlyHistoryColumns";
import { Star, Users, Building2, Shield, ArrowUp, ArrowDown, Swords, Hammer, Sparkles, Share2 } from "lucide-react";

interface PlayerDetailsContentProps {
  playerData: PlayerStats;
}

// Componente para conteúdo expandido da guerra
function WarExpandedContent({ war }: { war: any }) {
  return (
    <div className="p-4 space-y-4">
      {/* Ataques */}
      {war.attacks && war.attacks.length > 0 ? (
        <div>
          <h4 className="font-semibold text-sm mb-3">Ataques ({war.attacks.length})</h4>
          <div className="space-y-2">
            {war.attacks
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((attack: any, index: number) => (
                <div
                  key={`${attack.defenderTag}-${index}`}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{attack.order || index + 1}</span>
                      <span className="font-medium text-sm">{attack.defenderName || attack.defenderTag}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="font-semibold">
                      {attack.stars} ⭐
                    </Badge>
                    <span className="text-muted-foreground min-w-[60px] text-right">
                      {attack.destructionPercentage.toFixed(1)}%
                    </span>
                    {attack.duration !== undefined && attack.duration !== null && (
                      <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                        {Math.floor(attack.duration / 60)}:{(attack.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Nenhum ataque registrado</div>
      )}
    </div>
  );
}

export function PlayerDetailsContent({ playerData }: PlayerDetailsContentProps) {
  const { player, warHistory, cwlHistory, friendlyHistory, totalStats } = playerData;
  
  // Adiciona renderExpandedContent às guerras (backend já agrupa)
  const groupedWarHistory = warHistory.map((war) => ({
    ...war,
    renderExpandedContent: (data: any) => <WarExpandedContent war={data} />,
  }));
  const groupedCwlHistory = cwlHistory.map((war) => ({
    ...war,
    renderExpandedContent: (data: any) => <WarExpandedContent war={data} />,
  }));
  const groupedFriendlyHistory = friendlyHistory.map((war) => ({
    ...war,
    renderExpandedContent: (data: any) => <WarExpandedContent war={data} />,
  }));

  // Calcula progresso de heróis, tropas e feitiços
  const calculateProgress = () => {
    if (!player.heroes || !player.troops || !player.spells) return null;
    
    const heroes = player.heroes.filter((h: any) => h.village === "home");
    const troops = player.troops.filter((t: any) => t.village === "home");
    const spells = player.spells.filter((s: any) => s.village === "home");
    
    const heroesTotal = heroes.reduce((sum: number, h: any) => sum + (h.level || 0), 0);
    const heroesMax = heroes.reduce((sum: number, h: any) => sum + (h.maxLevel || 0), 0);
    
    const troopsTotal = troops.reduce((sum: number, t: any) => sum + (t.level || 0), 0);
    const troopsMax = troops.reduce((sum: number, t: any) => sum + (t.maxLevel || 0), 0);
    
    const spellsTotal = spells.reduce((sum: number, s: any) => sum + (s.level || 0), 0);
    const spellsMax = spells.reduce((sum: number, s: any) => sum + (s.maxLevel || 0), 0);
    
    return {
      heroes: { current: heroesTotal, max: heroesMax },
      troops: { current: troopsTotal, max: troopsMax },
      spells: { current: spellsTotal, max: spellsMax },
    };
  };

  const progress = calculateProgress();

  // Função para traduzir role
  const translateRole = (role: string) => {
    const roles: Record<string, string> = {
      leader: "Líder",
      coLeader: "Co-líder",
      admin: "Elder",
      member: "Membro",
    };
    return roles[role] || role;
  };

  // Função para obter o caminho da imagem do Town Hall
  const getTownHallImage = (level: number) => {
    if (level >= 3 && level <= 18) {
      return `/townhall/th${level}_min.png`;
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header com Badges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {player.townHallLevel && getTownHallImage(player.townHallLevel) && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <Image
                  src={getTownHallImage(player.townHallLevel)!}
                  alt={`Town Hall ${player.townHallLevel}`}
                  width={80}
                  height={80}
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            {player.league?.iconUrls?.medium && (
              <img
                src={player.league.iconUrls.medium}
                alt={player.league.name}
                className="w-16 h-16 rounded-lg"
              />
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">{player.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{player.tag}</p>
            </div>
          </div>
        </div>

        {/* Badges Principais */}
        <div className="flex flex-wrap gap-2">
          {player.townHallLevel && (
            <Tooltip content="Nível do Centro de Vila">
              <Badge variant="default" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Shield className="h-4 w-4" />
                CV {player.townHallLevel}
              </Badge>
            </Tooltip>
          )}
          {player.builderHallLevel && (
            <Tooltip content="Nível da Base do Construtor">
              <Badge variant="default" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Building2 className="h-4 w-4" />
                BC {player.builderHallLevel}
              </Badge>
            </Tooltip>
          )}
          {player.expLevel !== undefined && (
            <Tooltip content="Nível de Experiência">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Shield className="h-4 w-4" />
                Nível {player.expLevel}
              </Badge>
            </Tooltip>
          )}
          {player.clan && (
            <Tooltip content="Clã atual">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                {player.clan.badgeUrls?.small && (
                  <img src={player.clan.badgeUrls.small} alt={player.clan.name} className="w-4 h-4" />
                )}
                {player.clan.name}
              </Badge>
            </Tooltip>
          )}
          {player.role && (
            <Tooltip content="Cargo no clã">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-semibold">
                {translateRole(player.role)}
              </Badge>
            </Tooltip>
          )}
        </div>

        {/* Estatísticas em Badges */}
        <div className="flex flex-wrap gap-2">
          {player.trophies !== undefined && (
            <Tooltip content="Troféus atuais">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Star className="h-4 w-4" />
                {player.trophies.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
          {player.legendStatistics?.legendTrophies !== undefined && (
            <Tooltip content="Troféus Lendários">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Sparkles className="h-4 w-4" />
                {player.legendStatistics.legendTrophies.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
          {player.builderBaseTrophies !== undefined && (
            <Tooltip content="Troféus Builder">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Hammer className="h-4 w-4" />
                {player.builderBaseTrophies.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
          {player.warStars !== undefined && (
            <Tooltip content="Estrelas de Guerra">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Star className="h-4 w-4" />
                {player.warStars.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
          {player.donations !== undefined && (
            <Tooltip content="Doações enviadas">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <ArrowUp className="h-4 w-4" />
                {player.donations.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
          {player.donationsReceived !== undefined && (
            <Tooltip content="Doações recebidas">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <ArrowDown className="h-4 w-4" />
                {player.donationsReceived.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
          {player.clanCapitalContributions !== undefined && (
            <Tooltip content="Contribuições do Capital">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Hammer className="h-4 w-4" />
                {player.clanCapitalContributions.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
          {player.attackWins !== undefined && (
            <Tooltip content="Vitórias em ataque">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Swords className="h-4 w-4" />
                {player.attackWins.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
          {player.defenseWins !== undefined && (
            <Tooltip content="Vitórias em defesa">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                <Shield className="h-4 w-4" />
                {player.defenseWins.toLocaleString()}
              </Badge>
            </Tooltip>
          )}
        </div>

        {/* Melhores Recordes */}
        {(player.bestTrophies !== undefined || player.bestBuilderBaseTrophies !== undefined) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Melhores Recordes</h3>
            <div className="flex flex-wrap gap-2">
              {player.bestTrophies !== undefined && (
                <Tooltip content="Melhor recorde de troféus">
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                    <Star className="h-4 w-4" />
                    {player.bestTrophies.toLocaleString()}
                  </Badge>
                </Tooltip>
              )}
              {player.bestBuilderBaseTrophies !== undefined && (
                <Tooltip content="Melhor recorde Builder">
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm font-semibold gap-1.5">
                    <Hammer className="h-4 w-4" />
                    {player.bestBuilderBaseTrophies.toLocaleString()}
                  </Badge>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Labels */}
        {player.labels && player.labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {player.labels.map((label: any) => (
              <Badge key={label.id} variant="outline" className="px-3 py-1.5 text-sm gap-1.5">
                {label.iconUrls?.small && (
                  <img src={label.iconUrls.small} alt={label.name} className="w-4 h-4" />
                )}
                {label.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Informações Adicionais - Liga e Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liga e Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {player.legendStatistics?.currentSeason && (
              <Tooltip content="Ranking na Liga Lendária">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ranking Atual</span>
                  <span className="font-semibold">#{player.legendStatistics.currentSeason.rank?.toLocaleString()}</span>
                </div>
              </Tooltip>
            )}
            {player.builderBaseLeague && (
              <Tooltip content="Liga Builder">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Liga Builder</span>
                  <span className="font-semibold text-sm">{player.builderBaseLeague.name}</span>
                </div>
              </Tooltip>
            )}
            {player.warPreference && (
              <Tooltip content="Preferência de guerra">
                <Badge variant={player.warPreference === "in" ? "default" : "secondary"}>
                  {player.warPreference === "in" ? "Participando" : "Fora"}
                </Badge>
              </Tooltip>
            )}
            {player.clan?.clanLevel && (
              <Tooltip content="Nível do clã">
                <Badge variant="outline">{player.clan.clanLevel}</Badge>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Estatísticas - Layout compacto em tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estatísticas Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold">Tipo</th>
                  <th className="text-center py-2 px-3 font-semibold">Total</th>
                  <th className="text-center py-2 px-3 font-semibold text-green-600">Vitórias</th>
                  <th className="text-center py-2 px-3 font-semibold text-red-600">Derrotas</th>
                  <th className="text-center py-2 px-3 font-semibold text-blue-600">Empates</th>
                  <th className="text-center py-2 px-3 font-semibold">Média</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Guerras Aleatórias</td>
                  <td className="text-center py-2 px-3">{totalStats.wars.total}</td>
                  <td className="text-center py-2 px-3 text-green-600 font-semibold">{totalStats.wars.wins}</td>
                  <td className="text-center py-2 px-3 text-red-600 font-semibold">{totalStats.wars.losses}</td>
                  <td className="text-center py-2 px-3 text-blue-600 font-semibold">{totalStats.wars.ties}</td>
                  <td className="text-center py-2 px-3">
                    {totalStats.wars.averageStars.toFixed(1)}⭐ / {totalStats.wars.averageDestruction.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">CWL</td>
                  <td className="text-center py-2 px-3">{totalStats.cwl.total}</td>
                  <td className="text-center py-2 px-3 text-green-600 font-semibold">{totalStats.cwl.wins}</td>
                  <td className="text-center py-2 px-3 text-red-600 font-semibold">{totalStats.cwl.losses}</td>
                  <td className="text-center py-2 px-3 text-blue-600 font-semibold">{totalStats.cwl.ties}</td>
                  <td className="text-center py-2 px-3">
                    {totalStats.cwl.averageStars.toFixed(1)}⭐ / {totalStats.cwl.averageDestruction.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Amistosas</td>
                  <td className="text-center py-2 px-3">{totalStats.friendly.total}</td>
                  <td className="text-center py-2 px-3 text-green-600 font-semibold">{totalStats.friendly.wins}</td>
                  <td className="text-center py-2 px-3 text-red-600 font-semibold">{totalStats.friendly.losses}</td>
                  <td className="text-center py-2 px-3 text-blue-600 font-semibold">{totalStats.friendly.ties}</td>
                  <td className="text-center py-2 px-3">
                    {totalStats.friendly.averageStars.toFixed(1)}⭐ / {totalStats.friendly.averageDestruction.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com Histórico */}
      <Tabs defaultValue="wars" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wars">Guerras ({groupedWarHistory.length})</TabsTrigger>
          <TabsTrigger value="cwl">CWL ({groupedCwlHistory.length})</TabsTrigger>
          <TabsTrigger value="friendly">Amistosas ({groupedFriendlyHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="wars" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Guerras Aleatórias</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Todas as guerras aleatórias em que o jogador participou
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupedWarHistory.length > 0 ? (
                <DataTable
                  columns={warHistoryColumns}
                  data={groupedWarHistory}
                  searchPlaceholder="Filtrar por data ou clan..."
                  searchKeys={["warEndTime", "clanName", "opponentName", "clanTag", "opponentTag"]}
                  pageSize={10}
                />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhuma guerra aleatória encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cwl" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de CWL</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Todas as guerras de CWL em que o jogador participou
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupedCwlHistory.length > 0 ? (
                <DataTable
                  columns={cwlHistoryColumns}
                  data={groupedCwlHistory}
                  searchPlaceholder="Filtrar por data ou clan..."
                  searchKeys={["warEndTime", "clanName", "opponentName", "clanTag", "opponentTag"]}
                  pageSize={10}
                />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhuma guerra de CWL encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friendly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Amistosas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Todas as guerras amistosas em que o jogador participou
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupedFriendlyHistory.length > 0 ? (
                <DataTable
                  columns={friendlyHistoryColumns}
                  data={groupedFriendlyHistory}
                  searchPlaceholder="Filtrar por data ou clan..."
                  searchKeys={["warEndTime", "clanName", "opponentName", "clanTag", "opponentTag"]}
                  pageSize={10}
                />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhuma guerra amistosa encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
