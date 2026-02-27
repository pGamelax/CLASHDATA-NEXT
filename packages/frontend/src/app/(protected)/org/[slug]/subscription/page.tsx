import { getValidatedOrganization } from "@/lib/page-helpers";
import { SubscriptionContent } from "./SubscriptionContent";

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Permite acesso à página de billing mesmo com assinatura expirada
  const { organization } = await getValidatedOrganization(slug, true);

  // O layout já renderiza o header e container, apenas retornamos o conteúdo
  return <SubscriptionContent organization={organization} />;
}
