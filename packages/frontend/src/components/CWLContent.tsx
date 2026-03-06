"use client";

import { useState, useEffect, useCallback } from "react";
import { getCWLRanking, type CWLPlayerStats } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./CWLContent/columns";
import { ExpandedRowContent } from "./CWLContent/ExpandedRowContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { MonthFilter } from "./WarsContent/MonthFilter";

interface CWLContentProps {
  initialRanking: CWLPlayerStats[];
  organization: any;
  organizations: any[];
  clan?: any;
}

export function CWLContent({
  initialRanking,
  organization,
  organizations,
  clan,
}: CWLContentProps) {
  const [ranking, setRanking] = useState<CWLPlayerStats[]>(initialRanking);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Array<{ year: number; month: number }>>([]);
  const [selectedOrg, setSelectedOrg] = useState(organization);
  const [selectedClan, setSelectedClan] = useState(clan);

  // Atualiza selectedOrg e selectedClan quando props mudarem (apenas uma vez)
  useEffect(() => {
    if (organization && organization.id !== selectedOrg?.id) {
      setSelectedOrg(organization);
    }
    if (clan && clan.clanTag !== selectedClan?.clanTag) {
      setSelectedClan(clan);
    } else if (!clan && selectedClan) {
      // Se o clan foi removido, limpa o estado
      setSelectedClan(null);
    }
  }, [organization?.id, clan?.clanTag]); // Usa apenas IDs para evitar loops

  // Gera lista de meses disponíveis (últimos 12 meses)
  const getAvailableMonths = () => {
    const months: Array<{ year: number; month: number; label: string }> = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
      months.push({ year, month, label: monthName });
    }
    
    return months;
  };

  const availableMonths = getAvailableMonths();

  // Carrega ranking quando clan ou meses mudarem
  const loadRanking = useCallback(async () => {
    // Sempre usa o clanTag do clan, que sempre deve existir
    const clanTag = selectedClan?.clanTag;
    
    if (!clanTag || selectedMonths.length === 0) {
      setRanking([]);
      return;
    }

    setIsLoading(true);
    try {
      const cleanTag = clanTag.replace("#", "");
      const data = await getCWLRanking(cleanTag, selectedMonths, true);
      // Garante que warsParticipated existe em todos os players (normalização adicional)
      const normalizedData = data.map((player: any) => {
        // Converte seasonsParticipated antigo se necessário
        if (player.seasonsParticipated !== undefined && player.seasonsParticipated !== null) {
          player.warsParticipated = player.seasonsParticipated;
        }
        // Fallback se ainda não tiver warsParticipated
        return {
          ...player,
          warsParticipated: player.warsParticipated ?? player.totalAttacks ?? 0,
        };
      });
      setRanking(normalizedData);
    } catch (error) {
      setRanking([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClan, selectedMonths]);

  // Inicializa com mês atual se não houver meses selecionados
  useEffect(() => {
    if (selectedMonths.length === 0 && selectedClan?.clanTag) {
      const now = new Date();
      setSelectedMonths([{ year: now.getFullYear(), month: now.getMonth() + 1 }]);
    }
  }, [selectedClan, selectedMonths.length]);

  // Carrega ranking quando meses ou clan mudarem
  useEffect(() => {
    if (selectedMonths.length > 0 && selectedClan?.clanTag) {
      loadRanking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonths.length, selectedClan?.clanTag]); // Remove loadRanking da dependência para evitar loop

  // Escuta mudanças de organização apenas via eventos (sem polling)
  useEffect(() => {
    const handleOrganizationChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ organizationId: string }>;
      const { organizationId } = customEvent.detail;
      
      if (organizationId && organizationId !== selectedOrg?.id) {
        const org = organizations.find((o: any) => o.id === organizationId);
        if (org) {
          setSelectedOrg(org);
          // Reseta meses quando organização muda
          const now = new Date();
          setSelectedMonths([{ year: now.getFullYear(), month: now.getMonth() + 1 }]);
        }
      }
    };

    window.addEventListener("organizationChanged", handleOrganizationChange);
    return () => {
      window.removeEventListener("organizationChanged", handleOrganizationChange);
    };
  }, [organizations, selectedOrg?.id]);

  const handleMonthsChange = (months: Array<{ year: number; month: number }>) => {
    setSelectedMonths(months);
  };

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
    <div className="container mx-auto  px-4 py-4 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Ranking de CWL</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Classificação dos melhores jogadores nas temporadas de CWL
        </p>
      </div>

      {/* Filtro de Meses */}
      <MonthFilter
        availableMonths={availableMonths}
        selectedMonths={selectedMonths}
        onMonthsChange={handleMonthsChange}
      />

      {/* Tabela de Ranking */}
      {isLoading ? (
        <Card className="border-2">
          <CardContent className="p-8 sm:p-12 text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground">Carregando ranking...</p>
          </CardContent>
        </Card>
      ) : ranking.length > 0 ? (
        <Card className="border-2">
          <CardContent className="p-2 sm:p-6">
            <DataTable
              columns={columns}
              data={ranking.map((player) => ({
                ...player,
                renderExpandedContent: (player: CWLPlayerStats) => (
                  <ExpandedRowContent player={player} />
                ),
              }))}
              searchPlaceholder="Filtrar por nome ou tag..."
              searchKeys={["name", "tag"]}
              pageSize={10}
            />
          </CardContent>
        </Card>
      ) : selectedMonths.length > 0 ? (
        <Card className="border-2 text-center">
          <CardContent className="p-8 sm:p-12">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Nenhum dado encontrado para as temporadas selecionadas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 text-center">
          <CardContent className="p-8 sm:p-12">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecione pelo menos uma temporada para visualizar o ranking.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

