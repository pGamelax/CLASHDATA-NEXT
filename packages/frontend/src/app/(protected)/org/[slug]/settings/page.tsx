import { getValidatedOrganization } from "@/lib/page-helpers";
import { getSession } from "@/lib/api";
import { redirect } from "next/navigation";
import { SettingsContent } from "./SettingsContent";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization, cookieHeader } = await getValidatedOrganization(slug);
  const session = await getSession(cookieHeader);

  const isOwner =
    organization.members?.some(
      (m: any) => m.userId === session?.user?.id && m.role === "owner"
    ) ?? false;

  if (!isOwner) redirect(`/org/${slug}`);

  return <SettingsContent organization={organization} />;
}
