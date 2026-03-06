import { getCWLRanking, type CWLPlayerStats } from "@/lib/api";
import { CWLContent } from "@/components/CWLContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  return generateClanMetadata(slug, clan, "Ranking CWL", "Ranking CWL | CLASHDATA");
}

export default async function CWLPage({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { organization, organizations, selectedClan } = await getValidatedClan(
    slug,
    clan,
    (slug, clanSlug) => `/org/${slug}/${clanSlug}/cwl`
  );
  let initialRanking: CWLPlayerStats[] = [];
  try {
    const clanTag = selectedClan.clanTag.replace("#", "");
    const now = new Date();
    const currentMonth = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
    initialRanking = await getCWLRanking(clanTag, [currentMonth], false);
  } catch (error) {
    console.error("Erro ao buscar ranking inicial de CWL:", error);
  }

  return (
    <CWLContent
      initialRanking={initialRanking}
      organization={organization}
      organizations={organizations}
      clan={selectedClan}
    />
  );
}

