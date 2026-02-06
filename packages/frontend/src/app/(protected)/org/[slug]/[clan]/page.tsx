import { ClanDashboardContent } from "@/components/ClanDashboardContent";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  return generateClanMetadata(slug, clan, "Dashboard", "Dashboard | CLASHDATA");
}

export default async function ClanPage({
  params,
}: {
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const { organization, selectedClan } = await getValidatedClan(
    slug,
    clan,
    (slug, clanSlug) => `/org/${slug}/${clanSlug}`
  );

  return (
    <ClanDashboardContent
      organization={organization}
      clan={selectedClan}
    />
  );
}

