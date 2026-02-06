import { getValidatedOrganization } from "@/lib/page-helpers";
import { MembersContent } from "./MembersContent";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await getValidatedOrganization(slug);

  return <MembersContent organization={organization} />;
}
