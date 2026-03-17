"use client";

import { useState, useEffect, useCallback } from "react";
import { getCWLRanking, type CWLPlayerStats } from "@/lib/api";
import { RankingList } from "@/components/RankingList";
import { MonthFilter } from "@/components/WarsContent/MonthFilter";
import { ExpandedRowContent } from "@/components/CWLContent/ExpandedRowContent";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Swords } from "lucide-react";

interface CWLContentProps {
  initialRanking: CWLPlayerStats[];
  organization: any;
  organizations: any[];
  clan?: any;
}

function getAvailableMonths() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: date.toLocaleString("pt-BR", { month: "long", year: "numeric" }),
    };
  });
}

const availableMonths = getAvailableMonths();

function monthsLabel(selectedMonths: Array<{ year: number; month: number }>): string {
  if (selectedMonths.length === 0) return "—";
  return selectedMonths
    .map(({ year, month }) => {
      const date = new Date(year, month - 1, 1);
      const mon = date.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
      return `${mon.charAt(0).toUpperCase() + mon.slice(1)}/${String(year).slice(2)}`;
    })
    .join(", ");
}

export function CWLContent({ initialRanking, organization, organizations, clan }: CWLContentProps) {
  const [ranking, setRanking] = useState<CWLPlayerStats[]>(initialRanking);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Array<{ year: number; month: number }>>(() => {
    const now = new Date();
    return [{ year: now.getFullYear(), month: now.getMonth() + 1 }];
  });
  const [selectedOrg, setSelectedOrg] = useState(organization);
  const [selectedClan, setSelectedClan] = useState(clan);

  useEffect(() => {
    if (organization?.id !== selectedOrg?.id) setSelectedOrg(organization);
    if (clan?.clanTag !== selectedClan?.clanTag) setSelectedClan(clan ?? null);
  }, [organization?.id, clan?.clanTag]);

  const loadRanking = useCallback(async () => {
    const clanTag = selectedClan?.clanTag;
    if (!clanTag || selectedMonths.length === 0) {
      setRanking([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCWLRanking(clanTag.replace("#", ""), selectedMonths, true);
      setRanking(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar ranking");
      setRanking([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClan?.clanTag, selectedMonths]);

  useEffect(() => {
    if (selectedMonths.length > 0 && selectedClan?.clanTag) {
      loadRanking();
    }
  }, [selectedMonths, selectedClan?.clanTag]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { organizationId } = (e as CustomEvent<{ organizationId: string }>).detail;
      if (organizationId && organizationId !== selectedOrg?.id) {
        const org = organizations.find((o: any) => o.id === organizationId);
        if (org) {
          setSelectedOrg(org);
          const now = new Date();
          setSelectedMonths([{ year: now.getFullYear(), month: now.getMonth() + 1 }]);
        }
      }
    };
    window.addEventListener("organizationChanged", handler);
    return () => window.removeEventListener("organizationChanged", handler);
  }, [organizations, selectedOrg?.id]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking de CWL</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Desempenho dos jogadores nas temporadas de CWL
        </p>
      </div>

      <MonthFilter
        availableMonths={availableMonths}
        selectedMonths={selectedMonths}
        onMonthsChange={setSelectedMonths}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center space-y-3">
            <AlertCircle className="h-7 w-7 mx-auto text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadRanking}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : selectedMonths.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          Selecione ao menos um mês para ver o ranking.
        </div>
      ) : ranking.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Swords className="h-8 w-8 opacity-30" />
          <p className="text-sm">Nenhum dado encontrado para o período selecionado.</p>
        </div>
      ) : (
        <RankingList
          data={ranking}
          clanName={selectedClan?.name ?? "Clã"}
          title="Ranking de CWL"
          selectedMonthsLabel={monthsLabel(selectedMonths)}
          renderExpanded={(player) => <ExpandedRowContent player={player as CWLPlayerStats} />}
        />
      )}
    </div>
  );
}
