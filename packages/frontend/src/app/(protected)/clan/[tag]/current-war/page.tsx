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
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return generateClanMetadata(tag, "Guerra Atual", "Guerra Atual | CLASHDATA");
}

export default async function CurrentWarPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { clan, cookieHeader } = await getValidatedClan(tag);

  const clanTag = clan.tag.replace("#", "");

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
          <span className="font-medium text-foreground">{clan.name}</span> em tempo real
        </p>
      </div>

      {notInWar ? (
        <Card className="border-muted">
          <CardHeader className="flex-row items-center gap-3">
            <Swords className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <CardTitle className="text-base">Sem guerra ativa</CardTitle>
              <CardDescription>
                <strong>{clan.name}</strong> não está em guerra no momento.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : analysis ? (
        <CurrentWarContent analysis={analysis} clanName={clan.name} />
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex-row items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <CardTitle className="text-base">Não foi possível carregar a guerra</CardTitle>
              <CardDescription>
                Não foi possível obter dados da guerra de <strong>{clan.name}</strong>.
                Tente atualizar a página.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
