import { getValidatedOrganization } from "@/lib/page-helpers";
import { SubscriptionContent } from "./SubscriptionContent";

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await getValidatedOrganization(slug, true);
  return <SubscriptionContent organization={organization} />;
}
