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
  // Converte cookies do Next.js para string de header HTTP
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const session = await getSession(cookieHeader);

  // Se não estiver autenticado, redireciona para login
  // Os layouts específicos já tratam o callbackUrl
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader user={session.user} />
      <main>{children}</main>
    </div>
  );
}
