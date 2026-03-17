import { cookies } from "next/headers";
import { getCurrentWar } from "@/lib/api";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";
import { CurrentWarContent } from "@/components/CurrentWarContent";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Swords } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  return generateClanMetadata(slug, clan, "Guerra Atual", "Guerra Atual | CLASHDATA");
}

export default async function CurrentWarPage({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { selectedClan } = await getValidatedClan(
    slug,
    clan,
    (s, c) => `/org/${s}/${c}/current-war`
  );

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const clanTag = selectedClan.clanTag.replace("#", "");

  let analysis = null;
  let notInWar = false;
  try {
    analysis = await getCurrentWar(clanTag, cookieHeader);
  } catch (err: any) {
    if (err.message?.includes("não está em guerra") || err.status === 404) {
      notInWar = true;
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guerra Atual</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe a guerra de{" "}
          <span className="font-medium text-foreground">{selectedClan.name}</span> em tempo real
        </p>
      </div>

      {notInWar ? (
        <Card className="border-muted">
          <CardHeader className="flex-row items-center gap-3">
            <Swords className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <CardTitle className="text-base">Sem guerra ativa</CardTitle>
              <CardDescription>
                <strong>{selectedClan.name}</strong> não está em guerra no momento.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : analysis ? (
        <CurrentWarContent analysis={analysis} clanName={selectedClan.name} />
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex-row items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <CardTitle className="text-base">Não foi possível carregar a guerra</CardTitle>
              <CardDescription>
                Não foi possível obter dados da guerra de <strong>{selectedClan.name}</strong>.
                Tente atualizar a página.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
