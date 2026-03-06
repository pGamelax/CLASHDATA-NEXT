import { getWarRanking, type PlayerStats } from "@/lib/api";
import { WarsContent } from "@/components/WarsContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  return generateClanMetadata(slug, clan, "Ranking Random", "Ranking Random | CLASHDATA");
}

export default async function WarsPage({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { organization, organizations, selectedClan } = await getValidatedClan(
    slug,
    clan,
    (slug, clanSlug) => `/org/${slug}/${clanSlug}/wars`
  );
  let initialRanking: PlayerStats[] = [];
  try {
    const clanTag = selectedClan.clanTag.replace("#", "");
    const now = new Date();
    const currentMonth = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
    initialRanking = await getWarRanking(clanTag, [currentMonth], false);
  } catch (error) {
    console.error("Erro ao buscar ranking inicial:", error);
  }

  return (
    <WarsContent
      initialRanking={initialRanking}
      organization={organization}
      organizations={organizations}
      clan={selectedClan}
    />
  );
}

