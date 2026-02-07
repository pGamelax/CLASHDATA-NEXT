import { CurrentCWLContent } from "@/components/CurrentCWLContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  return generateClanMetadata(slug, clan, "CWL Atual", "CWL Atual | CLASHDATA");
}

export default async function CurrentCWLPage({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { selectedClan } = await getValidatedClan(
    slug,
    clan,
    (slug, clanSlug) => `/org/${slug}/${clanSlug}/current-cwl`
  );

  return <CurrentCWLContent clanTag={selectedClan.clanTag} />;
}
