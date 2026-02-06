import { cookies } from "next/headers";
import { getSession, getOrganizations, getClansByOrganization } from "@/lib/api";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
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
      <Header 
        user={session.user} 
        organization={organization}
        clan={selectedClan}
        clans={clans}
      />
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

