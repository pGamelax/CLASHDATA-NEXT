import { CurrentWarContent } from "@/components/CurrentWarContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  return generateClanMetadata(slug, clan, "Guerra Atual", "Guerra Atual | CLASHDATA");
}

export default async function CurrentWarPage({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { selectedClan } = await getValidatedClan(
    slug,
    clan,
    (slug, clanSlug) => `/org/${slug}/${clanSlug}/current-war`
  );

  return <CurrentWarContent clanTag={selectedClan.clanTag} />;
}

