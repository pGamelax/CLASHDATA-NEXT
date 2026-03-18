import type { Metadata } from "next";
import { AvatarSettings } from "./AvatarSettings";
import { cookies } from "next/headers";
import { getSession } from "@/lib/api";

export const metadata: Metadata = {
  title: "Configurações — CLASHDATA",
};

export default async function UserSettingsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const session = await getSession(cookieHeader);

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as configurações da sua conta.</p>
      </div>

      <div className="space-y-6">
        {/* Profile card */}
        <div className="rounded-xl border bg-card">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Perfil</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Avatar e informações básicas.</p>
          </div>
          <div className="px-6 py-6">
            <AvatarSettings
              currentImage={session?.user?.image ?? null}
              userName={session?.user?.name ?? ""}
            />
          </div>
        </div>

        {/* Placeholder sections */}
        <div className="rounded-xl border bg-card opacity-50">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Segurança</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Troca de senha e autenticação — em breve.</p>
          </div>
          <div className="px-6 py-5 text-sm text-muted-foreground">
            Esta seção será disponibilizada em breve.
          </div>
        </div>
      </div>
    </div>
  );
}
