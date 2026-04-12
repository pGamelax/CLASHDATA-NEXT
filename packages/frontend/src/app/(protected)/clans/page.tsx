import { cookies } from "next/headers";
import { getMyClans } from "@/lib/api";
import Link from "next/link";
import { Shield, Plus, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meus Clans | CLASHDATA",
};

function normalizeTag(tag: string) {
  return tag.replace("#", "").toLowerCase();
}

interface Clan {
  id: string;
  name: string;
  tag: string;
  badgeUrls?: { small?: string; medium?: string; large?: string } | null;
  subscription?: { plan?: string; status?: string } | null;
}

export default async function ClansPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const clans: Clan[] = (await getMyClans(cookieHeader)) ?? [];

  if (clans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Nenhum clan cadastrado</h1>
          <p className="text-muted-foreground max-w-sm">
            Adicione seu primeiro clan para começar a acompanhar guerras, rankings e muito mais.
          </p>
        </div>
        <Button asChild>
          <Link href="/pricing">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar clan
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Meus Clans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clans.length} {clans.length === 1 ? "clan cadastrado" : "clans cadastrados"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/pricing">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {clans.map((clan) => {
          const slug = normalizeTag(clan.tag);
          const isActive = clan.subscription?.status === "active";

          return (
            <Link
              key={clan.id}
              href={`/clan/${slug}`}
              className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm hover:bg-accent/30"
            >
              {/* Badge */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                {clan.badgeUrls?.medium ? (
                  <img
                    src={clan.badgeUrls.medium}
                    alt={clan.name}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <Shield className="h-6 w-6 text-primary" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{clan.name}</span>
                  {isActive && (
                    <Crown className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{clan.tag}</span>
                {clan.subscription && (
                  <span
                    className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isActive ? "Ativo" : "Inativo"}
                  </span>
                )}
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
