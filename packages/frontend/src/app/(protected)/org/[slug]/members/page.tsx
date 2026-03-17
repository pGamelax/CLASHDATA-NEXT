import { getValidatedOrganization } from "@/lib/page-helpers";
import { getSession, getSubscription, type Subscription } from "@/lib/api";
import { MembersContent } from "./MembersContent";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization, cookieHeader } = await getValidatedOrganization(slug);

  const [session, subscription] = await Promise.all([
    getSession(cookieHeader),
    getSubscription(organization.id, cookieHeader),
  ]);

  const isOwner =
    organization.members?.some(
      (m: any) => m.userId === session?.user?.id && m.role === "owner"
    ) ?? false;

  return (
    <MembersContent
      organization={organization}
      isOwner={isOwner}
      subscription={subscription as Subscription | null}
    />
  );
}
