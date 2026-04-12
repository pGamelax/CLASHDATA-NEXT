import { fetchClanData } from "@/lib/api";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";
import { ClanPanel } from "@/components/ClanPanel";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return generateClanMetadata(tag, "Dashboard", "Dashboard | CLASHDATA");
}

export default async function ClanPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { clan, cookieHeader } = await getValidatedClan(tag);

  const clanTag = clan.tag.replace("#", "");

  let clanData = null;
  try {
    clanData = await fetchClanData(clanTag, cookieHeader, true);
  } catch {
    // handled below
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Painel geral de <span className="font-medium text-foreground">{clan.name}</span>
        </p>
      </div>

      {clanData ? (
        <ClanPanel initialData={clanData} clanTag={clanTag} />
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex-row items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <CardTitle className="text-base">Não foi possível carregar os dados</CardTitle>
              <CardDescription>
                O clan <strong>{clan.name}</strong> ({clan.tag}) não respondeu.
                Tente atualizar a página.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
