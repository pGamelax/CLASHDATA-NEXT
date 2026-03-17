import { cookies } from "next/headers";
import { getSeasonSnapshotsByClan } from "@/lib/api";
import { SeasonEndContent } from "@/components/SeasonEndContent";
import { generateClanMetadata, getOrganizationAndClan } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { selectedClan } = await getOrganizationAndClan(slug, clan);
  const clanName = selectedClan?.metadata?.name || selectedClan?.name || `Clan ${clan}`;
  return generateClanMetadata(
    slug,
    clan,
    "Fim de Temporada",
    "Fim de Temporada | CLASHDATA",
    `Classificação final dos jogadores do clã ${clanName}`
  );
}

export default async function SeasonEndPage({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { organization, organizations, selectedClan } = await getValidatedClan(
    slug,
    clan,
    (slug, clanSlug) => `/org/${slug}/${clanSlug}/season-end`
  );

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let snapshots: any[] = [];
  try {
    snapshots = await getSeasonSnapshotsByClan(selectedClan.clanTag, cookieHeader);
  } catch {
    // render empty state
  }

  return (
    <SeasonEndContent
      snapshots={snapshots}
      clanName={selectedClan.name ?? "Clã"}
    />
  );
}
