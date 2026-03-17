import { cookies } from "next/headers";
import { getPlayerPushLogs } from "@/lib/api";
import { PlayerPushContent } from "@/components/PlayerPushContent";
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
    "Player Push",
    "Player Push | CLASHDATA",
    `Logs de push dos jogadores do clã ${clanName}`
  );
}

export default async function PlayerPushPage({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { organization, organizations, selectedClan } = await getValidatedClan(
    slug,
    clan,
    (slug, clanSlug) => `/org/${slug}/${clanSlug}/player-push`
  );

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let initialPlayerPushLogs: any[] = [];
  try {
    const clanTag = selectedClan.clanTag.replace("#", "");
    initialPlayerPushLogs = await getPlayerPushLogs(clanTag, cookieHeader);
  } catch (error) {
    console.error("Erro ao buscar logs de player push:", error);
  }

  return (
    <PlayerPushContent
      initialPlayerPushLogs={initialPlayerPushLogs}
      organization={organization}
      organizations={organizations}
      clan={selectedClan}
    />
  );
}
