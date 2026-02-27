import { getClansByOrganization } from "@/lib/api";
import { OrganizationOverview } from "@/components/OrganizationOverview";
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

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Verifica assinatura expirada e redireciona se necessário
  const { organization, cookieHeader } = await getValidatedOrganization(slug);

  // Busca os clans da organização
  const clansResponse = await getClansByOrganization(organization.id, cookieHeader);
  const clans = clansResponse?.data || clansResponse || [];

  return <OrganizationOverview organization={{ ...organization, clans }} />;
}

