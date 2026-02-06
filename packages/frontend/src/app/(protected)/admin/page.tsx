import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ClientHeader } from "@/components/ClientHeader";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const session = await getSession(cookieHeader);

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader initialUser={session.user} />
      <AdminDashboard />
    </div>
  );
}
