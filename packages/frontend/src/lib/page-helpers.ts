import { cookies } from "next/headers";
import { getOrganizations, getClansByOrganization } from "@/lib/api";
import { redirect } from "next/navigation";

/**
 * Cria o header de cookies a partir dos cookies do Next.js
 */
export function getCookieHeader(): string {
  const cookieStore = cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

/**
 * Busca e valida organização baseado no slug
 * Faz redirect se não encontrar
 */
export async function getValidatedOrganization(slug: string) {
  const cookieHeader = getCookieHeader();
  const organizations = await getOrganizations(cookieHeader);
  const orgsList = organizations?.data || organizations || [];

  if (!Array.isArray(orgsList)) {
    redirect("/organizations");
  }

  const organization = orgsList.find((org: any) => org.slug === slug);

  if (!organization) {
    redirect("/organizations");
  }

  return { organization, organizations: orgsList, cookieHeader };
}

/**
 * Converte a tag do clan para slug (remove # e converte para lowercase)
 */
export function clanTagToSlug(clanTag: string): string {
  return clanTag.replace("#", "").toLowerCase();
}

/**
 * Busca e valida clan baseado no slug e parâmetro clan
 * Faz redirect se necessário
 */
export async function getValidatedClan(
  slug: string,
  clan: string | undefined,
  redirectPath: (slug: string, clanSlug: string) => string
) {
  const { organization, organizations, cookieHeader } = await getValidatedOrganization(slug);

  // Busca os clans da organização
  const clansResponse = await getClansByOrganization(organization.id, cookieHeader);
  const clans = clansResponse?.data || clansResponse || [];

  // Se não há clans, redireciona para a página da organização
  if (!clans || clans.length === 0) {
    redirect(`/org/${slug}`);
  }

  // Se o parâmetro clan é "undefined" ou vazio, redireciona para o primeiro clan
  if (!clan || clan === "undefined" || clan.trim() === "") {
    const firstClan = clans[0];
    const firstClanSlug = clanTagToSlug(firstClan.clanTag);
    redirect(redirectPath(slug, firstClanSlug));
  }

  // Encontra o clan pelo slug (tag sem #)
  const selectedClan = clans.find(
    (c: any) => clanTagToSlug(c.clanTag) === clan.toLowerCase()
  );

  if (!selectedClan) {
    // Se não encontrou o clan, redireciona para o primeiro
    const firstClan = clans[0];
    const firstClanSlug = clanTagToSlug(firstClan.clanTag);
    redirect(redirectPath(slug, firstClanSlug));
  }

  return {
    organization,
    organizations,
    selectedClan,
    cookieHeader,
  };
}
