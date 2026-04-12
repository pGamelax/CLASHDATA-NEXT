import { PlayerPushContent } from "@/components/PlayerPushContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return generateClanMetadata(tag, "Player Push", "Player Push | CLASHDATA");
}

export default async function PlayerPushPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { clan } = await getValidatedClan(tag);

  return (
    <PlayerPushContent clan={{ ...clan, clanTag: clan.tag }} />
  );
}
