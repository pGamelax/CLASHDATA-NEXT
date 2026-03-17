import { getValidatedOrganization } from "@/lib/page-helpers";
import { getSubscription, type Subscription } from "@/lib/api";
import { SubscriptionContent } from "./SubscriptionContent";
import { AlertCircle } from "lucide-react";

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization, cookieHeader } = await getValidatedOrganization(slug, true);
  const data = await getSubscription(organization.id, cookieHeader);
  const subscription: Subscription | null = data?.subscription ?? null;

  if (!subscription) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Assinatura não encontrada para esta organização.</span>
      </div>
    );
  }

  return (
    <SubscriptionContent
      organization={{ id: organization.id, slug: organization.slug, name: organization.name }}
      subscription={subscription}
    />
  );
}
