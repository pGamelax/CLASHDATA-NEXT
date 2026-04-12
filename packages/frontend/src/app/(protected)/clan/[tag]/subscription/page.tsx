import { getSubscription, getPixStatus, getPlans } from "@/lib/api";
import { generateClanMetadata } from "@/lib/metadata";
import { getValidatedClan, clanTagToSlug } from "@/lib/page-helpers";
import { ClanSubscriptionContent } from "@/components/ClanSubscriptionContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return generateClanMetadata(tag, "Assinatura", "Assinatura | CLASHDATA");
}

export default async function ClanSubscriptionPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { clan, cookieHeader } = await getValidatedClan(tag, true);

  const [subscriptionData, pixData, plans] = await Promise.all([
    getSubscription(clan.id, cookieHeader).catch(() => null),
    getPixStatus(clan.id).catch(() => ({ pix: null })),
    getPlans().catch(() => []),
  ]);

  return (
    <ClanSubscriptionContent
      clan={clan}
      subscription={subscriptionData?.subscription ?? null}
      pendingPix={pixData?.pix ?? null}
      plans={plans}
    />
  );
}
