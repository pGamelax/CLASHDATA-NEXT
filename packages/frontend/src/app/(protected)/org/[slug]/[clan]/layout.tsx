import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { getValidatedClan } from "@/lib/page-helpers";
import { redirect } from "next/navigation";

export default async function ClanLayoutPage({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; clan: string }>;
}) {
  const { slug, clan } = await params;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Validates org, subscription status, and clan membership — redirects if any check fails
  await getValidatedClan(slug, clan, (s, c) => `/org/${s}/${c}`);

  return <>{children}</>;
}
