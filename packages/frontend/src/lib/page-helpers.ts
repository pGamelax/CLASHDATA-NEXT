import { cookies } from "next/headers";
import { getClanByTag, getSubscription, getSession } from "@/lib/api";
import { redirect } from "next/navigation";

export async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export function clanTagToSlug(clanTag: string): string {
  return clanTag.replace("#", "").toLowerCase();
}

/**
 * Validates a clan by tag. Checks ownership + subscription status.
 * Redirects if the clan is not found or subscription is expired.
 * Pass `allowBillingPage: true` to skip subscription redirect (for the billing page itself).
 */
export async function getValidatedClan(
  tag: string,
  allowBillingPage = false
) {
  const cookieHeader = await getCookieHeader();

  const result = await getClanByTag(tag, cookieHeader);
  const clan = result?.data ?? result?.clan ?? result;

  if (!clan) {
    redirect("/");
  }

  const session = await getSession(cookieHeader);
  const isAdmin = session?.user?.role === "admin";

  if (!allowBillingPage && !isAdmin) {
    const subscriptionData = await getSubscription(clan.id, cookieHeader);
    const sub = subscriptionData?.subscription;

    if (sub) {
      const now = new Date();
      const isExpiredStatus = sub.status === "EXPIRED" || sub.status === "CANCELLED";
      const periodPassed = sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd) <= now
        : true;

      const isTrialExpired =
        sub.status === "TRIAL" &&
        sub.trialEndsAt &&
        new Date(sub.trialEndsAt) <= now;

      const isActivePeriodExpired =
        sub.status === "ACTIVE" &&
        sub.currentPeriodEnd &&
        new Date(sub.currentPeriodEnd) < now;

      if ((isExpiredStatus && periodPassed) || isTrialExpired || isActivePeriodExpired) {
        redirect(`/clan/${clanTagToSlug(clan.tag)}/subscription`);
      }
    }
  }

  return { clan, cookieHeader };
}
