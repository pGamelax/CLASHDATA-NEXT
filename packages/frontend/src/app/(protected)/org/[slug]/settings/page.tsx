import { getValidatedOrganization } from "@/lib/page-helpers";
import { SettingsContent } from "./SettingsContent";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await getValidatedOrganization(slug);

  return <SettingsContent organization={organization} />;
}
