import { getWarRanking, type PlayerStats } from "@/lib/api";
import { WarsContent } from "@/components/WarsContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return generateClanMetadata(tag, "Ranking Random", "Ranking Random | CLASHDATA");
}

export default async function WarsPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { clan } = await getValidatedClan(tag);

  let initialRanking: PlayerStats[] = [];
  try {
    const clanTag = clan.tag.replace("#", "");
    const now = new Date();
    initialRanking = await getWarRanking(clanTag, [{ year: now.getFullYear(), month: now.getMonth() + 1 }], false);
  } catch {
    // render empty state
  }

  const clanForComponent = { ...clan, clanTag: clan.tag };

  return (
    <WarsContent
      initialRanking={initialRanking}
      clan={clanForComponent}
    />
  );
}
