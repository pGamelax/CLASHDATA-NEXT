import { getSeasonSnapshotsByClan } from "@/lib/api";
import { SeasonEndContent } from "@/components/SeasonEndContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return generateClanMetadata(tag, "Fim de Temporada", "Fim de Temporada | CLASHDATA");
}

export default async function SeasonEndPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { clan, cookieHeader } = await getValidatedClan(tag);

  let snapshots: any[] = [];
  try {
    snapshots = await getSeasonSnapshotsByClan(clan.tag, cookieHeader);
  } catch {
    // render empty state
  }

  return (
    <SeasonEndContent
      snapshots={snapshots}
      clanName={clan.name ?? "Clã"}
    />
  );
}
