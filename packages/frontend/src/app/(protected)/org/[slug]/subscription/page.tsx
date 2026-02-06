import { getValidatedOrganization } from "@/lib/page-helpers";
import { SubscriptionContent } from "./SubscriptionContent";

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await getValidatedOrganization(slug);

  // O layout já renderiza o header e container, apenas retornamos o conteúdo
  return <SubscriptionContent organization={organization} />;
}
