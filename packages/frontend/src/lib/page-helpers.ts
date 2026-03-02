import { cookies } from "next/headers";
import { getOrganizations, getClansByOrganization, getSubscription } from "@/lib/api";
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
 * Verifica se a assinatura está expirada e redireciona para billing se necessário
 */
export async function getValidatedOrganization(slug: string, allowBillingPage: boolean = false) {
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

  // Verifica se a assinatura está expirada ou cancelada (exceto na página de billing)
  if (!allowBillingPage && organization.subscription) {
    const subscriptionData = await getSubscription(organization.id, cookieHeader);
    
    if (subscriptionData?.subscription) {
      const sub = subscriptionData.subscription;
      const now = new Date();
      
      // Se status é CANCELLED ou EXPIRED, verifica se o período ainda está válido
      if (sub.status === "EXPIRED" || sub.status === "CANCELLED") {
        // Se tem currentPeriodEnd e ainda está no futuro, permite acesso
        if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > now) {
          // Ainda está no período válido, permite acesso
        } else {
          // Período já passou, bloqueia acesso
          redirect(`/org/${slug}/subscription`);
        }
      } else if (sub.status === "ACTIVE" && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < now) {
        // Status ACTIVE mas período já passou
        redirect(`/org/${slug}/subscription`);
      } else if (sub.status === "TRIAL" && sub.trialEndsAt && new Date(sub.trialEndsAt) < now) {
        // Trial expirado
        redirect(`/org/${slug}/subscription`);
      }
    }
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
