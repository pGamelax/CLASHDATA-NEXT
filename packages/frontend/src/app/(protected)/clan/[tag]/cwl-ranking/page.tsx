import { getCWLRanking, type CWLPlayerStats } from "@/lib/api";
import { CWLContent } from "@/components/CWLContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return generateClanMetadata(tag, "Ranking CWL", "Ranking CWL | CLASHDATA");
}

export default async function CWLPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { clan } = await getValidatedClan(tag);

  let initialRanking: CWLPlayerStats[] = [];
  try {
    const clanTag = clan.tag.replace("#", "");
    const now = new Date();
    initialRanking = await getCWLRanking(clanTag, [{ year: now.getFullYear(), month: now.getMonth() + 1 }], false);
  } catch {
    // render empty state
  }

  const clanForComponent = { ...clan, clanTag: clan.tag };

  return (
    <CWLContent
      initialRanking={initialRanking}
      clan={clanForComponent}
    />
  );
}
