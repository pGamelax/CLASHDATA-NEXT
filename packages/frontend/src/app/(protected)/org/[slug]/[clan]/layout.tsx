import { cookies } from "next/headers";
import { getSession, getOrganizations, getClansByOrganization } from "@/lib/api";
import { redirect } from "next/navigation";
import { ClanLayout } from "@/components/ClanLayout";

export default async function ClanLayoutPage({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const session = await getSession(cookieHeader);
  if (!session?.user) {
    const currentPath = `/org/${slug}/${clan}`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(currentPath)}`);
  }

  const organizations = await getOrganizations(cookieHeader);
  const orgsList = organizations?.data || organizations || [];

  if (!Array.isArray(orgsList)) {
    redirect("/");
  }

  const organization = orgsList.find((org: any) => org.slug === slug);

  if (!organization) {
    redirect("/");
  }
  if (organization.subscription) {
    const { getSubscription } = await import("@/lib/api");
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
  const clansResponse = await getClansByOrganization(organization.id, cookieHeader);
  const clans = clansResponse?.data || clansResponse || [];
  if (!clans || clans.length === 0) {
    redirect(`/org/${slug}`);
  }
  if (!clan || clan === "undefined" || clan.trim() === "") {
    const firstClan = clans[0];
    const firstClanSlug = firstClan.clanTag.replace("#", "").toLowerCase();
    redirect(`/org/${slug}/${firstClanSlug}`);
  }
  const selectedClan = clans.find(
    (c: any) => c.clanTag.replace("#", "").toLowerCase() === clan.toLowerCase()
  );

  if (!selectedClan) {
    const firstClan = clans[0];
    const firstClanSlug = firstClan.clanTag.replace("#", "").toLowerCase();
    redirect(`/org/${slug}/${firstClanSlug}`);
  }

  return (
    <>
      <ClanLayout
        organization={organization}
        clan={selectedClan}
        clans={clans}
      >
        {children}
      </ClanLayout>
    </>
  );
}

