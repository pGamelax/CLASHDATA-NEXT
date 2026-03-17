import { getPublicClanRanking, getSession } from "@/lib/api";
import { ClientHeader } from "@/components/ClientHeader";
import { cookies } from "next/headers";
import { Trophy, Shield, Users, TrendingUp, ArrowRight, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import type { PublicClanRank } from "@/lib/api";

export const metadata: Metadata = {
  title: "Ranking Global de Clãs | CLASHDATA",
  description: "Os clãs mais fortes registrados no CLASHDATA ordenados por pontos.",
};

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-500", label: "🥇" };
  if (rank === 2) return { bg: "bg-slate-400/10 border-slate-400/30", text: "text-slate-400", label: "🥈" };
  if (rank === 3) return { bg: "bg-amber-600/10 border-amber-600/30", text: "text-amber-600", label: "🥉" };
  return { bg: "", text: "text-muted-foreground", label: String(rank) };
}

function ClanRow({ clan, rank }: { clan: PublicClanRank; rank: number }) {
  const style = getRankStyle(rank);
  const badgeUrl = (clan.badgeUrls as any)?.small || (clan.badgeUrls as any)?.medium;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 bg-card ${rank <= 3 ? style.bg : "border-border"}`}
    >
      {/* Rank */}
      <div className={`w-10 text-center font-bold text-lg shrink-0 ${style.text}`}>
        {rank <= 3 ? style.label : <span className="text-base">{rank}</span>}
      </div>

      {/* Badge */}
      <div className="shrink-0">
        {badgeUrl ? (
          <img src={badgeUrl} alt={clan.name} className="h-10 w-10 object-contain" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold truncate">{clan.name}</span>
          {clan.clanLevel && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Nv. {clan.clanLevel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {clan.organization.name}
        </p>
      </div>

      {/* Members */}
      <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground shrink-0">
        <Users className="h-3.5 w-3.5" />
        <span>{clan.members ?? "—"}</span>
      </div>

      {/* Points */}
      <div className="shrink-0 text-right">
        <div className={`text-lg font-bold tabular-nums ${rank <= 3 ? style.text : ""}`}>
          {(clan.clanPoints ?? 0).toLocaleString("pt-BR")}
        </div>
        <div className="text-xs text-muted-foreground">pts</div>
      </div>
    </div>
  );
}

export default async function RankingPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const [session, clans] = await Promise.all([
    getSession(cookieHeader),
    getPublicClanRanking(),
  ]);

  const totalPoints = clans.reduce((acc, c) => acc + (c.clanPoints ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader initialUser={session?.user} />

      {/* Header */}
      <section className="border-b bg-gradient-to-b from-primary/8 to-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-medium">
            <Trophy className="h-4 w-4 text-primary" />
            Ranking Global
          </div>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            Os Melhores Clãs do CLASHDATA
          </h1>
          <p className="text-muted-foreground mb-8">
            Clãs registrados na plataforma ordenados por pontos de troféus
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="rounded-xl border bg-card p-4">
              <div className="text-2xl font-bold text-primary">{clans.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Clãs</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-2xl font-bold text-primary">
                {clans.reduce((acc, c) => acc + (c.members ?? 0), 0).toLocaleString("pt-BR")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Membros</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-2xl font-bold text-primary">
                {totalPoints > 0 ? `${(totalPoints / 1000).toFixed(0)}k` : "0"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Total pts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking list */}
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        {clans.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl">
            <Trophy className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="font-bold text-lg mb-2">Nenhum clã registrado ainda</h3>
            <p className="text-muted-foreground mb-6">
              Seja o primeiro a cadastrar seu clã no CLASHDATA
            </p>
            <Button asChild>
              <Link href="/sign-up">Começar Agora</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center gap-4 px-4 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div className="w-10 text-center">#</div>
              <div className="w-10 shrink-0" />
              <div className="flex-1">Clã</div>
              <div className="hidden sm:block w-16 text-center">Membros</div>
              <div className="w-16 text-right">Pontos</div>
            </div>

            <div className="space-y-2">
              {clans.map((clan, i) => (
                <ClanRow key={clan.tag} clan={clan} rank={i + 1} />
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        {!session?.user && clans.length > 0 && (
          <div className="mt-10 text-center p-8 rounded-2xl border-2 border-dashed">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-primary opacity-60" />
            <h3 className="font-bold text-lg mb-2">Cadastre seu clã</h3>
            <p className="text-muted-foreground text-sm mb-5">
              Crie uma conta, registre seu clã e apareça no ranking global
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/sign-up">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">Ver Planos</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
