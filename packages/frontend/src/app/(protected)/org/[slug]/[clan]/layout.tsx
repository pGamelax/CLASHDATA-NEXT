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

  // Verifica se a assinatura está expirada ou cancelada e redireciona para billing
  if (organization.subscription) {
    const { getSubscription } = await import("@/lib/api");
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
    const firstClanSlug = firstClan.clanTag.replace("#", "").toLowerCase();
    redirect(`/org/${slug}/${firstClanSlug}`);
  }

  // Encontra o clan pelo slug (tag sem #)
  const selectedClan = clans.find(
    (c: any) => c.clanTag.replace("#", "").toLowerCase() === clan.toLowerCase()
  );

  if (!selectedClan) {
    // Se não encontrou o clan, redireciona para o primeiro
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

