"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Users, Trophy, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/api";

interface OrganizationOverviewProps {
  organization: any;
}

export function OrganizationOverview({ organization }: OrganizationOverviewProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      try {
        const session = await getSession();
        setCurrentUser(session?.user || null);
        
        if (organization && session?.user) {
          const member = organization.members?.find(
            (m: any) => m.userId === session.user.id
          );
          // Apenas o owner pode adicionar clans
          setIsOwner(member?.role === "owner");
        }
      } catch (error) {
        // Erro silencioso - permissão negada por padrão
      }
    }
    
    checkPermissions();
  }, [organization]);

  const clans = organization.clans || [];
  const totalClans = clans.length;
  const totalMembers = clans.reduce((sum: number, clan: any) => sum + (clan.members || clan.metadata?.members || 0), 0);
  const totalClanLevel = clans.reduce((sum: number, clan: any) => sum + (clan.clanLevel || clan.metadata?.clanLevel || 0), 0);
  const avgClanLevel = totalClans > 0 ? Math.round(totalClanLevel / totalClans) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Visão geral da organização {organization.name}
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clans</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClans}</div>
            <p className="text-xs text-muted-foreground">Clans cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Jogadores nos clans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível Médio</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClanLevel}</div>
            <p className="text-xs text-muted-foreground">Nível médio dos clans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organização</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.members?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Membros da organização</p>
          </CardContent>
        </Card>
      </div>

      {/* Clans Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Clans</CardTitle>
              <CardDescription>
                Gerencie os clans desta organização
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/org/${organization.slug}/clans`}>
                  Ver Todos
                </Link>
              </Button>
              {isOwner && (
                <Button asChild>
                  <Link href={`/org/${organization.slug}/clans/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Clan
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clans && clans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clans
                .filter((clan: any) => clan.tag || clan.clanTag)
                .slice(0, 6) 
                .map((clan: any) => {
                  const clanTag = clan.tag || clan.clanTag || "";
                  return (
                    <Card key={clan.id} className="border-2 hover:border-primary transition-colors">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          {(clan.badgeUrls?.large || clan.metadata?.badgeUrls?.large) && (
                            <img
                              src={clan.badgeUrls?.large || clan.metadata?.badgeUrls?.large}
                              alt={clan.name}
                              className="h-12 w-12"
                            />
                          )}
                          {!clan.badgeUrls?.large && !clan.metadata?.badgeUrls?.large && (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <Shield className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{clan.name}</CardTitle>
                            <CardDescription className="font-mono text-xs">
                              {clanTag}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm mb-4">
                          {(clan.clanLevel || clan.metadata?.clanLevel) && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Nível:</span>
                              <span className="font-medium">{clan.clanLevel || clan.metadata?.clanLevel}</span>
                            </div>
                          )}
                          {(clan.members !== undefined || clan.metadata?.members !== undefined) && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Membros:</span>
                              <span className="font-medium">{clan.members || clan.metadata?.members || 0}/50</span>
                            </div>
                          )}
                        </div>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/org/${organization.slug}/${clanTag.replace("#", "").toLowerCase()}`}>
                            Ver Dashboard
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhum clan adicionado ainda
              </p>
              {isOwner && (
                <Button asChild>
                  <Link href={`/org/${organization.slug}/clans/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Clan
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

