import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/AdminLayout";

export default async function AdminLayoutWrapper({
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

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
}
