"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Users, Trophy } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/api";

interface ClansListProps {
  organization: {
    id: string;
    slug: string;
    name: string;
    members?: Array<{
      userId: string;
      role: string;
    }>;
  };
  clans: any[];
}

export function ClansList({ organization, clans }: ClansListProps) {
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
          setIsOwner(member?.role === "owner" || session.user.role === "admin");
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
      }
    }
    
    checkPermissions();
  }, [organization]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clans</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os clans da organização {organization.name}
          </p>
        </div>
        {isOwner && (
          <Button asChild>
            <Link href={`/org/${organization.slug}/clans/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Clan
            </Link>
          </Button>
        )}
      </div>

      {clans && clans.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clans
            .filter((clan: any) => clan.tag || clan.clanTag)
            .map((clan: any) => {
              const clanTag = clan.tag || clan.clanTag || "";
              const badgeUrl = clan.badgeUrls?.large || clan.metadata?.badgeUrls?.large;
              const clanLevel = clan.clanLevel || clan.metadata?.clanLevel;
              const members = clan.members || clan.metadata?.members;
              const clanPoints = clan.clanPoints || clan.metadata?.clanPoints;
              
              return (
                <Card key={clan.id} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {badgeUrl && (
                        <img
                          src={badgeUrl}
                          alt={clan.name}
                          className="h-16 w-16"
                        />
                      )}
                      {!badgeUrl && (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Shield className="h-8 w-8 text-muted-foreground" />
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
                    <div className="space-y-3 mb-4">
                      {clanLevel && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Nível:</span>
                          </div>
                          <span className="font-medium">{clanLevel}</span>
                        </div>
                      )}
                      {members !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Membros:</span>
                          </div>
                          <span className="font-medium">{members}/50</span>
                        </div>
                      )}
                      {clanPoints && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Pontos:</span>
                          </div>
                          <span className="font-medium">{clanPoints.toLocaleString()}</span>
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
        <Card>
          <CardContent className="text-center py-12">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
