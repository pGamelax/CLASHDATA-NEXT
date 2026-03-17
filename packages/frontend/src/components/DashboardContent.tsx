"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrganizations, fetchClanData } from "@/lib/api";
import { ClanPanel } from "@/components/ClanPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function DashboardContent() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [clanData, setClanData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadClanData = useCallback(async (org: any) => {
    if (!org?.metadata?.clanTag) {
      setClanData({
        tag: "",
        name: org.name || "Organização",
        type: "unknown",
        description: "",
        clanLevel: 0,
        clanPoints: 0,
        members: 0,
      });
      return;
    }

    try {
      const clanTag = org.metadata.clanTag.replace("#", "");
      const data = await fetchClanData(clanTag, undefined, true); // Usa cache no cliente
      setClanData(data);
    } catch (error) {
      console.error("Erro ao buscar dados do clan:", error);
      setClanData({
        tag: org.metadata.clanTag || "",
        name: org.name || "Organização",
        type: "unknown",
        description: "",
        clanLevel: 0,
        clanPoints: 0,
        members: 0,
      });
    }
  }, []);
  const loadOrganizations = useCallback(async () => {
    try {
      const orgs = await getOrganizations();
      const orgsList = orgs?.data || orgs || [];
      const orgsArray = Array.isArray(orgsList) ? orgsList : [];
      setOrganizations(orgsArray);
      return orgsArray;
    } catch (error) {
      console.error("Erro ao buscar organizações:", error);
      return [];
    }
  }, []);
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const orgsList = await loadOrganizations();

      if (Array.isArray(orgsList) && orgsList.length > 0) {
        const savedOrgId = localStorage.getItem("selectedOrganization");
        const org = savedOrgId
          ? orgsList.find((o: any) => o.id === savedOrgId) || orgsList[0]
          : orgsList[0];

        setSelectedOrg(org);
        await loadClanData(org);
      }

      setIsLoading(false);
    };

    loadData();
  }, [loadOrganizations, loadClanData]);
  useEffect(() => {
    const handleOrganizationEvent = async (event: Event) => {
      const customEvent = event as CustomEvent<{ organizationId?: string }>;
      const orgId = customEvent.detail?.organizationId || localStorage.getItem("selectedOrganization");
      
      if (orgId) {
        const orgsList = await loadOrganizations();
        if (Array.isArray(orgsList) && orgsList.length > 0) {
          const org = orgsList.find((o: any) => o.id === orgId) || orgsList[0];
          
          if (org && org.id !== selectedOrg?.id) {
            setSelectedOrg(org);
            await loadClanData(org);
          }
        }
      }
    };

    window.addEventListener("organizationCreated", handleOrganizationEvent);
    window.addEventListener("organizationChanged", handleOrganizationEvent);
    return () => {
      window.removeEventListener("organizationCreated", handleOrganizationEvent);
      window.removeEventListener("organizationChanged", handleOrganizationEvent);
    };
  }, [loadOrganizations, loadClanData, selectedOrg?.id]);
  useEffect(() => {
    const interval = setInterval(async () => {
      const savedOrgId = localStorage.getItem("selectedOrganization");
      if (savedOrgId && selectedOrg?.id !== savedOrgId) {
        const orgsList = await loadOrganizations();
        const org = Array.isArray(orgsList)
          ? orgsList.find((o: any) => o.id === savedOrgId)
          : null;
        
        if (org) {
          setSelectedOrg(org);
          await loadClanData(org);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedOrg?.id, loadOrganizations, loadClanData]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(organizations) || organizations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="border-2 text-center">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Nenhuma Organização</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Você ainda não possui nenhuma organização. Crie uma para começar!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!selectedOrg || !clanData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Carregando dados da organização...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
          Painel geral da organização
        </p>
      </div>

      <ClanPanel initialData={clanData} clanTag={selectedOrg?.metadata?.clanTag?.replace("#", "") || ""} />
    </div>
  );
}

