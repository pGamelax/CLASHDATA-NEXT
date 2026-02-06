import { getClansByOrganization } from "@/lib/api";
import { ClansList } from "@/components/ClansList";
import { generateOrganizationMetadata } from "@/lib/metadata";
import { getValidatedOrganization } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateOrganizationMetadata(slug);
}

export default async function ClansPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization, cookieHeader } = await getValidatedOrganization(slug);

  // Busca os clans da organização
  const clansResponse = await getClansByOrganization(organization.id, cookieHeader);
  const clans = clansResponse?.data || clansResponse || [];

  return <ClansList organization={organization} clans={clans} />;
}
