import { getCookieHeader } from "@/lib/page-helpers";
import { getOrganizations, getClansByOrganization } from "@/lib/api";
import { OrganizationsContent } from "./OrganizationsContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minhas Organizações | CLASHDATA",
  description: "Gerencie todas as suas organizações e clãs",
};

export default async function OrganizationsPage() {
  const cookieHeader = getCookieHeader();

  const organizations = await getOrganizations(cookieHeader);
  const orgsList = organizations?.data || organizations || [];

  const orgsWithClans = Array.isArray(orgsList)
    ? await Promise.all(
        orgsList.map(async (org: any) => {
          const clansResponse = await getClansByOrganization(org.id, cookieHeader);
          const clans = clansResponse?.data || clansResponse || [];
          return { ...org, clans: Array.isArray(clans) ? clans : [] };
        })
      )
    : [];

  return <OrganizationsContent organizations={orgsWithClans} />;
}
