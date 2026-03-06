import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { ClientHeader } from "@/components/ClientHeader";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const session = await getSession(cookieHeader);
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader initialUser={session.user} />
      <main>{children}</main>
    </div>
  );
}
