import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { AppSidebar } from "@/components/AppSidebar";
import { AnnouncementModal } from "@/components/AnnouncementModal";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";

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
    <SidebarProvider>
      <AppSidebar initialUser={session.user} />
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex-1" />
        </header>
        <main className="flex-1">
          <AnnouncementModal />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
