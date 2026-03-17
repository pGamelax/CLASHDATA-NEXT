import { cookies } from "next/headers";
import { getSession, getOrganizations } from "@/lib/api";
import { redirect } from "next/navigation";
import { OrganizationLayout } from "@/components/OrganizationLayout";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const organizations = await getOrganizations(cookieHeader);
  const orgsList = organizations?.data || organizations || [];

  if (!Array.isArray(orgsList)) {
    redirect("/");
  }

  const organization = orgsList.find((org: any) => org.slug === slug);

  if (!organization) {
    redirect("/");
  }

  return (
    <>
      <OrganizationLayout organization={organization} user={session.user}>
        {children}
      </OrganizationLayout>
    </>
  );
}

