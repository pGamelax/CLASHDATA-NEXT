import { getClansByOrganization, getSession } from "@/lib/api";
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

  const [clansResponse, session] = await Promise.all([
    getClansByOrganization(organization.id, cookieHeader),
    getSession(cookieHeader),
  ]);

  const clans = clansResponse?.data ?? clansResponse ?? [];
  const isOwner =
    organization.members?.some(
      (m: any) => m.userId === session?.user?.id && m.role === "owner"
    ) ?? false;

  return <ClansList organization={organization} clans={clans} isOwner={isOwner} />;
}
