"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchClanData } from "@/lib/api";
import { ClanPanel } from "@/components/ClanPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ClanDashboardContentProps {
  organization: any;
  clan: any;
}

export function ClanDashboardContent({ organization, clan }: ClanDashboardContentProps) {
  const [clanData, setClanData] = useState<any | null>(null);

  // Função para buscar dados do clan
  const loadClanData = useCallback(async () => {
    if (!clan?.clanTag) {
      setClanData({
        tag: "",
        name: clan.name || "Clan",
        type: "unknown",
        description: "",
        clanLevel: 0,
        clanPoints: 0,
        members: 0,
      });
      return;
    }

    try {
      const clanTag = clan.clanTag.replace("#", "");
      const data = await fetchClanData(clanTag, undefined, true); // Usa cache no cliente
      setClanData(data);
    } catch (error) {
      console.error("Erro ao buscar dados do clan:", error);
      // Se não conseguir buscar, cria dados básicos
      setClanData({
        tag: clan.clanTag || "",
        name: clan.name || "Clan",
        type: "unknown",
        description: "",
        clanLevel: 0,
        clanPoints: 0,
        members: 0,
      });
    } 
  }, [clan]);

  // Carrega dados do clan
  useEffect(() => {
    loadClanData();
  }, [loadClanData]);

  // Escuta mudanças no clan selecionado
  useEffect(() => {
    const handleClanChange = () => {
      const savedClanSlug = localStorage.getItem("selectedClan");
      if (savedClanSlug) {
        const clanSlug = clan.clanTag.replace("#", "").toLowerCase();
        if (savedClanSlug !== clanSlug) {
          // Se o clan mudou, recarrega os dados
          loadClanData();
        }
      }
    };

    window.addEventListener("clanChanged", handleClanChange);
    return () => {
      window.removeEventListener("clanChanged", handleClanChange);
    };
  }, [clan, loadClanData]);

  if (!clanData) {
    return (
      <div className="container mx-auto  px-4 py-4 max-w-7xl">
        <Card className="border-2 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Clan não encontrado</CardTitle>
            <CardDescription>
              Não foi possível carregar os dados do clan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto  px-4 py-4 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
          Painel geral do clan {clan.name}
        </p>
      </div>

      <ClanPanel initialData={clanData} organization={organization} />
    </div>
  );
}

