import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { ClientHeader } from "@/components/ClientHeader";
import { Button } from "@/components/ui/button";
import {
  Swords,
  Trophy,
  BarChart3,
  Zap,
  Users,
  Target,
  ArrowRight,
  Check,
  TrendingUp,
  Shield,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLASHDATA — Análise de Clãs para Clash of Clans",
  description: "Rankings, estatísticas avançadas e análise de guerras para o seu clã.",
};

const FEATURES = [
  {
    icon: Swords,
    title: "Ranking de Guerras",
    description: "Média bayesiana e estatísticas detalhadas de cada membro nas guerras aleatórias.",
  },
  {
    icon: Trophy,
    title: "Ranking CWL",
    description: "Desempenho completo na Clan War League por temporada com histórico total.",
  },
  {
    icon: Zap,
    title: "Guerra em Tempo Real",
    description: "Previsões de vitória, timeline completa e fechador da guerra identificado.",
  },
  {
    icon: BarChart3,
    title: "Analytics Avançado",
    description: "Estatísticas por jogador com médias bayesianas e métricas de performance.",
  },
  {
    icon: Target,
    title: "Previsões Inteligentes",
    description: "Sistema de previsão baseado em dados reais e análise estatística.",
  },
  {
    icon: Users,
    title: "Gestão de Organizações",
    description: "Múltiplos clãs em um único lugar com controle total de membros e acesso.",
  },
];

const INCLUDED = [
  "Dashboard completo",
  "Rankings de guerras e CWL",
  "Guerra em tempo real",
  "Estatísticas avançadas",
  "Histórico completo",
  "Suporte dedicado",
];

export default async function Home() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const session = await getSession(cookieHeader);

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader initialUser={session?.user} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.15),transparent)]" />
        <div className="container relative mx-auto px-4 py-24 sm:py-36 max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm font-medium">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Plataforma de Análise para Clash of Clans
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Gerencie seu Clã com{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Inteligência
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Rankings precisos, análise de guerras em tempo real e estatísticas avançadas.
            Tome as melhores decisões e leve seu clã ao topo.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {session?.user ? (
              <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg">
                <Link href="/organizations">
                  Minhas Organizações
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg">
                  <Link href="/sign-up">
                    Começar Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base border-2">
                  <Link href="/sign-in">Entrar</Link>
                </Button>
              </>
            )}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            3 dias grátis · Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { value: "100%", label: "Precisão nas Estatísticas" },
              { value: "24/7", label: "Monitoramento em Tempo Real" },
              { value: "∞", label: "Histórico Completo" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold sm:text-4xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Recursos Poderosos
          </h2>
          <p className="text-muted-foreground text-lg">
            Tudo que você precisa para analisar e gerenciar o seu clã
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border-2 bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-bold text-lg group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof / what's included */}
      <section className="border-y bg-gradient-to-b from-muted/20 to-muted/40">
        <div className="container mx-auto px-4 py-20 max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-sm text-primary font-semibold">
                <Shield className="h-4 w-4" />
                Incluído em todos os planos
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Tudo que você precisa, sem complicação
              </h2>
              <p className="text-muted-foreground mb-8">
                Comece com 3 dias grátis e acesse todos os recursos. Sem limites durante o trial.
              </p>
              <Button asChild size="lg" className="h-12 px-8">
                <Link href="/pricing">
                  Ver Planos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INCLUDED.map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="p-1 rounded-full bg-green-500/10 shrink-0">
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ranking CTA */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            Novo
          </div>
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
            Veja o Ranking Global de Clãs
          </h2>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            Descubra os clãs mais fortes registrados no CLASHDATA e veja onde o seu se posiciona.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/ranking">
                Ver Ranking
                <Trophy className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!session?.user && (
              <Button asChild size="lg" variant="outline" className="h-12 px-8 border-2">
                <Link href="/sign-up">Cadastrar meu Clã</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">CLASHDATA</span>
          <span>© {new Date().getFullYear()} CLASHDATA. Todos os direitos reservados.</span>
          <Link href="/ranking" className="hover:text-foreground transition-colors">
            Ranking Global
          </Link>
        </div>
      </footer>
    </div>
  );
}
