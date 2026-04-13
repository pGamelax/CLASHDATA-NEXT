import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { AppSidebar } from "@/components/AppSidebar";
import { AnnouncementModal } from "@/components/AnnouncementModal";
import { TopBarInfo } from "@/components/TopBarInfo";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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
    <SidebarProvider>
      <AppSidebar initialUser={session.user} />
      <SidebarInset>
        {/* Top bar */}
        <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center border-b px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          {/* Desktop: trigger on the left */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
          </div>
          <TopBarInfo />
        </header>
        <main className="flex-1">
          <AnnouncementModal />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
