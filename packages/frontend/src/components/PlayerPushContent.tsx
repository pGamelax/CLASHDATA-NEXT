"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getPlayerPushLogs, type PlayerPushStats } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./PlayerPushContent/columns";
import { ExpandedRowContent } from "./PlayerPushContent/ExpandedRowContent";
import { DayFilter } from "./PlayerPushContent/DayFilter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { extractUniqueDays, filterLogsByDay } from "./PlayerPushContent/utils";

interface PlayerPushContentProps {
  initialPlayerPushLogs: PlayerPushStats[];
  organization: any;
  organizations: any[];
  clan?: any;
}

export function PlayerPushContent({
  initialPlayerPushLogs,
  organization,
  organizations,
  clan,
}: PlayerPushContentProps) {
  const [playerPushLogs, setPlayerPushLogs] = useState<PlayerPushStats[]>(initialPlayerPushLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(organization);
  const [selectedClan, setSelectedClan] = useState(clan);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Atualiza selectedOrg e selectedClan quando props mudarem
  useEffect(() => {
    if (organization && organization.id !== selectedOrg?.id) {
      setSelectedOrg(organization);
    }
    if (clan) {
      setSelectedClan(clan);
    } else if (!clan && selectedClan) {
      // Se o clan foi removido, limpa o estado
      setSelectedClan(null);
    }
  }, [organization, selectedOrg?.id, clan]);

  // Carrega logs quando clan mudar
  const loadLogs = useCallback(async () => {
    const clanTag = selectedClan?.clanTag;
    
    if (!clanTag) {
      setPlayerPushLogs([]);
      return;
    }

    setIsLoading(true);
    try {
      const cleanTag = clanTag.replace("#", "");
      const data = await getPlayerPushLogs(cleanTag);
      setPlayerPushLogs(data);
    } catch (error) {
      console.error("[PlayerPushContent] Erro ao buscar logs:", error);
      setPlayerPushLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClan]);

  // Carrega logs quando clan mudar
  useEffect(() => {
    if (selectedClan?.clanTag) {
      loadLogs();
    }
  }, [selectedClan, loadLogs]);

  // Escuta mudanças de organização
  useEffect(() => {
    const handleOrganizationChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ organizationId: string }>;
      const { organizationId } = customEvent.detail;
      
      if (organizationId) {
        const org = organizations.find((o: any) => o.id === organizationId);
        if (org) {
          setSelectedOrg(org);
        }
      }
    };

    // Verifica periodicamente se a organização mudou
    const checkInterval = setInterval(() => {
      const savedOrgId = localStorage.getItem("selectedOrganization");
      if (savedOrgId && selectedOrg?.id !== savedOrgId) {
        const org = organizations.find((o: any) => o.id === savedOrgId);
        if (org) {
          setSelectedOrg(org);
        }
      }
    }, 500);

    window.addEventListener("organizationChanged", handleOrganizationChange);
    return () => {
      window.removeEventListener("organizationChanged", handleOrganizationChange);
      clearInterval(checkInterval);
    };
  }, [organizations, selectedOrg]);

  // Extrai todos os dias únicos dos logs
  const availableDays = useMemo(() => {
    const allLogs = playerPushLogs.flatMap((player) => player.logs);
     
    const allDays = extractUniqueDays(allLogs);
    setSelectedDay(allDays[0]);
    return allDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [playerPushLogs]);

  // Filtra os logs por dia selecionado
  const filteredPlayerPushLogs = useMemo(() => {
    if (!selectedDay) {
      return playerPushLogs;
    }

    return playerPushLogs
      .map((player) => {
        const filteredLogs = filterLogsByDay(player.logs, selectedDay);
        if (filteredLogs.length === 0) {
          return null;
        }

        // Recalcula totais baseado nos logs filtrados
        const attackLogs = filteredLogs.filter((log: any) => log.type === "attack");
        const defenseLogs = filteredLogs.filter((log: any) => log.type === "defense");

        return {
          ...player,
          logs: filteredLogs,
          totalAttack: attackLogs.reduce((sum: number, log: any) => sum + log.trophiesChange, 0),
          totalDefense: defenseLogs.reduce((sum: number, log: any) => sum + log.trophiesChange, 0),
          attackCount: attackLogs.length,
          defenseCount: defenseLogs.length,
        };
      })
      .filter((player): player is PlayerPushStats => player !== null);
  }, [playerPushLogs, selectedDay]);

  // Verifica se há um clan válido
  if (!selectedClan?.clanTag) {
    return (
      <div className="container mx-auto  px-4 py-4 max-w-7xl">
        <Card className="border-2 text-center">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Clan não encontrado</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Não foi possível encontrar o clan selecionado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Player Push</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Logs de push dos jogadores na Legend League
        </p>
      </div>

      {/* Filtro de Dias */}
      {availableDays.length > 0 && (
        <DayFilter
          days={availableDays}
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
        />
      )}

      {/* Tabela de Logs */}
      {isLoading ? (
        <Card className="border-2">
          <CardContent className="p-8 sm:p-12 text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground">Carregando logs...</p>
          </CardContent>
        </Card>
      ) : filteredPlayerPushLogs.length > 0 ? (
        <Card className="border-2">
          <CardContent className="p-2 sm:p-6">
            <DataTable
              columns={columns}
              data={filteredPlayerPushLogs.map((player) => ({
                ...player,
                renderExpandedContent: (player: PlayerPushStats) => (
                  <ExpandedRowContent player={player} selectedDay={selectedDay} />
                ),
              }))}
              searchPlaceholder="Filtrar por nome ou tag..."
              searchKeys={["name", "tag"]}
              pageSize={10}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 text-center">
          <CardContent className="p-8 sm:p-12">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Nenhum log de player push encontrado para este clã.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
