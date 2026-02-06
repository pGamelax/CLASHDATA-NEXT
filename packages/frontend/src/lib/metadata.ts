import { cookies } from "next/headers";
import { getOrganizations, getClansByOrganization } from "@/lib/api";
import type { Metadata } from "next";

/**
 * Busca organização e clan baseado nos parâmetros da URL
 */
export async function getOrganizationAndClan(slug: string, clan?: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const organizations = await getOrganizations(cookieHeader);
  const orgsList = organizations?.data || organizations || [];
  const organization = Array.isArray(orgsList)
    ? orgsList.find((org: any) => org.slug === slug)
    : null;

  if (!organization) {
    return { organization: null, selectedClan: null };
  }

  if (!clan) {
    return { organization, selectedClan: null };
  }

  const clansResponse = await getClansByOrganization(organization.id, cookieHeader);
  const clans = clansResponse?.data || clansResponse || [];
  const selectedClan = Array.isArray(clans)
    ? clans.find((c: any) => c.clanTag?.replace("#", "").toLowerCase() === clan.toLowerCase())
    : null;

  return { organization, selectedClan };
}

/**
 * Gera metadata para páginas de organização
 */
export async function generateOrganizationMetadata(
  slug: string,
  defaultTitle: string = "Organização | CLASHDATA"
): Promise<Metadata> {
  const { organization } = await getOrganizationAndClan(slug);

  return {
    title: organization ? `${organization.name} | CLASHDATA` : defaultTitle,
    description: organization
      ? `Gerencie os clãs da organização ${organization.name}`
      : "Gerencie sua organização",
  };
}

/**
 * Gera metadata para páginas de clan
 */
export async function generateClanMetadata(
  slug: string,
  clan: string,
  pageName: string,
  defaultTitle?: string,
  customDescription?: string
): Promise<Metadata> {
  const { organization, selectedClan } = await getOrganizationAndClan(slug, clan);

  if (!organization) {
    return {
      title: defaultTitle || `${pageName} | CLASHDATA`,
    };
  }

  const clanName = selectedClan?.metadata?.name || selectedClan?.name || `Clan ${clan}`;

  return {
    title: `${clanName} - ${pageName} | CLASHDATA`,
    description: customDescription || `${pageName} do clã ${clanName}`,
  };
}
