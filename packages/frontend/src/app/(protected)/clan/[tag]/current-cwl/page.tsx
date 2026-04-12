import { CurrentCWLContent } from "@/components/CurrentCWLContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return generateClanMetadata(tag, "CWL Atual", "CWL Atual | CLASHDATA");
}

export default async function CurrentCWLPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { clan } = await getValidatedClan(tag);

  return <CurrentCWLContent clanTag={clan.tag} />;
}
