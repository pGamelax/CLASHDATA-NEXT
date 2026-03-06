import { cookies } from "next/headers";
import { getOrganizations, getClansByOrganization, getSubscription } from "@/lib/api";
import { redirect } from "next/navigation";

export function getCookieHeader(): string {
  const cookieStore = cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

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
  if (!allowBillingPage && organization.subscription) {
    const subscriptionData = await getSubscription(organization.id, cookieHeader);
    
    if (subscriptionData?.subscription) {
      const sub = subscriptionData.subscription;
      const now = new Date();
      if (sub.status === "EXPIRED" || sub.status === "CANCELLED") {
        if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > now) {
        } else {
          redirect(`/org/${slug}/subscription`);
        }
      } else if (sub.status === "ACTIVE" && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < now) {
        redirect(`/org/${slug}/subscription`);
      } else if (sub.status === "TRIAL" && sub.trialEndsAt && new Date(sub.trialEndsAt) < now) {
        redirect(`/org/${slug}/subscription`);
      }
    }
  }

  return { organization, organizations: orgsList, cookieHeader };
}

export function clanTagToSlug(clanTag: string): string {
  return clanTag.replace("#", "").toLowerCase();
}

export async function getValidatedClan(
  slug: string,
  clan: string | undefined,
  redirectPath: (slug: string, clanSlug: string) => string
) {
  const { organization, organizations, cookieHeader } = await getValidatedOrganization(slug);
  const clansResponse = await getClansByOrganization(organization.id, cookieHeader);
  const clans = clansResponse?.data || clansResponse || [];
  if (!clans || clans.length === 0) {
    redirect(`/org/${slug}`);
  }
  if (!clan || clan === "undefined" || clan.trim() === "") {
    const firstClan = clans[0];
    const firstClanSlug = clanTagToSlug(firstClan.clanTag);
    redirect(redirectPath(slug, firstClanSlug));
  }
  const selectedClan = clans.find(
    (c: any) => clanTagToSlug(c.clanTag) === clan.toLowerCase()
  );

  if (!selectedClan) {
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
