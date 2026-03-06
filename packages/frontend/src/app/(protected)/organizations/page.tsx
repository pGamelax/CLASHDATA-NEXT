import { cookies } from "next/headers";
import { getOrganizations, getClansByOrganization } from "@/lib/api";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Users, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/api";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minhas Organizações | CLASHDATA",
  description: "Gerencie todas as suas organizações e clãs",
};

export default async function OrganizationsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const session = await getSession(cookieHeader);
  
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=" + encodeURIComponent("/organizations"));
  }

  const organizations = await getOrganizations(cookieHeader);
  const orgsList = organizations?.data || organizations || [];

  if (!Array.isArray(orgsList)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Erro ao carregar organizações
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const orgsWithClans = await Promise.all(
    orgsList.map(async (org: any) => {
      const clansResponse = await getClansByOrganization(org.id, cookieHeader);
      const clans = clansResponse?.data || clansResponse || [];
      return { ...org, clans: Array.isArray(clans) ? clans : [] };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Minhas Organizações
            </h1>
            <p className="mt-2 text-muted-foreground text-base">
              Gerencie todas as suas organizações e clãs em um só lugar
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            <Link href="/pricing">
              <Plus className="mr-2 h-4 w-4" />
              Nova Organização
            </Link>
          </Button>
        </div>

        {}
        {orgsWithClans.length === 0 ? (
          <Card className="border-2 border-dashed bg-gradient-to-br from-muted/40 to-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg">
                <Building2 className="h-14 w-14 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Nenhuma organização encontrada</h3>
              <p className="mb-8 text-center text-muted-foreground max-w-md">
                Comece criando sua primeira organização para gerenciar seus clãs e acompanhar suas estatísticas.
              </p>
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <Link href="/pricing">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Organização
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orgsWithClans.map((org: any) => (
              <Card
                key={org.id}
                className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:-translate-y-2 bg-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {org.logo ? (
                        <div className="relative">
                          <img
                            src={org.logo}
                            alt={org.name}
                            className="h-16 w-16 rounded-xl object-cover border-2 border-border group-hover:border-primary/50 transition-all shadow-md group-hover:shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all border-2 border-border group-hover:border-primary/50 shadow-md group-hover:shadow-lg">
                          <Building2 className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate text-lg font-bold group-hover:text-primary transition-colors">{org.name}</CardTitle>
                        <CardDescription className="truncate font-medium">@{org.slug}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    {org.clans && Array.isArray(org.clans) && org.clans.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/60 border border-border/50">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{org.clans.length} {org.clans.length === 1 ? "clã" : "clãs"}</span>
                      </div>
                    )}
                    <Button asChild className="w-full group-hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                      <Link href={`/org/${org.slug}`}>
                        Acessar Organização
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

