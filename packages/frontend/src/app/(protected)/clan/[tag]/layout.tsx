import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { getValidatedClan } from "@/lib/page-helpers";
import { redirect } from "next/navigation";

export default async function ClanLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await getSession(cookieHeader);
  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/clan/${tag}`)}`);
  }

  await getValidatedClan(tag, true);

  return <>{children}</>;
}
