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
  Activity,
  Flame,
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
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    icon: Trophy,
    title: "Ranking CWL",
    description: "Desempenho completo na Clan War League por temporada com histórico total.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    icon: Zap,
    title: "Guerra em Tempo Real",
    description: "Previsões de vitória, timeline completa e fechador da guerra identificado.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: BarChart3,
    title: "Analytics Avançado",
    description: "Estatísticas por jogador com médias bayesianas e métricas de performance.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: Target,
    title: "Previsões Inteligentes",
    description: "Sistema de previsão baseado em dados reais e análise estatística.",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    icon: Users,
    title: "Gestão de Organizações",
    description: "Múltiplos clãs em um único lugar com controle total de membros e acesso.",
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Cadastre seu clã",
    description: "Adicione a tag do seu clã e sincronize automaticamente com a API oficial.",
  },
  {
    number: "02",
    title: "Analise os dados",
    description: "Acesse rankings precisos, histórico de guerras e performance de cada membro.",
  },
  {
    number: "03",
    title: "Tome decisões melhores",
    description: "Use os dados para montar o melhor time de guerra e dominar a CWL.",
  },
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 pt-20 pb-28 sm:pt-28 sm:pb-36 max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />
            A plataforma número 1 de análise de Clash of Clans
          </div>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter sm:text-6xl lg:text-[5rem] leading-[1.05]">
            Pare de perder guerras
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              por falta de dados.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            Rankings precisos, análise em tempo real e estatísticas avançadas.
            Tome decisões baseadas em dados e leve seu clã ao topo.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {session?.user ? (
              <Button asChild size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                <Link href="/organizations">
                  Minhas Organizações
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                  <Link href="/sign-up">
                    Começar Grátis — 3 dias
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                  <Link href="/ranking">Ver Ranking Global</Link>
                </Button>
              </>
            )}
          </div>

          <p className="mt-5 text-sm text-muted-foreground/70">
            Sem cartão de crédito · Cancele quando quiser
          </p>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { value: "100%", label: "Precisão", icon: Target },
              { value: "24/7", label: "Tempo Real", icon: Activity },
              { value: "∞", label: "Histórico", icon: TrendingUp },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-2xl border bg-card/80 backdrop-blur p-5 text-center">
                <div className="text-3xl font-black sm:text-4xl bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                  {value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-sm font-black text-primary">{step.number}</span>
                </div>
                <div>
                  <h3 className="font-bold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24 max-w-6xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Flame className="h-3.5 w-3.5" />
            Recursos
          </div>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tudo que seu clã precisa
          </h2>
          <p className="text-muted-foreground text-lg">
            Ferramentas poderosas para dominar cada guerra e temporada de CWL
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/3 to-transparent" />
              <div className={`relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} border ${feature.border}`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="relative mb-2 font-bold">{feature.title}</h3>
              <p className="relative text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Included + CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-24 max-w-5xl">
          <div className="rounded-3xl border-2 border-primary/15 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent p-10 lg:p-14">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wide">
                  <Shield className="h-3 w-3" />
                  Incluído em todos os planos
                </div>
                <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
                  Sem surpresas.<br />Tudo incluso.
                </h2>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  Comece com 3 dias grátis e acesse todos os recursos sem limitações.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="h-12 px-8 font-semibold shadow-lg shadow-primary/20">
                    <Link href="/sign-up">
                      Começar Grátis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-8">
                    <Link href="/pricing">Ver Planos</Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  "Dashboard completo",
                  "Rankings de guerras e CWL",
                  "Guerra em tempo real",
                  "Estatísticas avançadas",
                  "Histórico completo",
                  "Suporte dedicado",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3.5 rounded-xl border bg-background/60">
                    <div className="shrink-0 h-5 w-5 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking CTA */}
      <section className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-16 max-w-5xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary uppercase tracking-wide">
            <TrendingUp className="h-3.5 w-3.5" />
            Ranking Global
          </div>
          <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl tracking-tight">
            Veja onde seu clã se posiciona
          </h2>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            Descubra os clãs mais fortes registrados no CLASHDATA.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/ranking">
                Ver Ranking
                <Trophy className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!session?.user && (
              <Button asChild size="lg" variant="outline" className="h-12 px-8">
                <Link href="/sign-up">Cadastrar meu Clã</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="font-bold text-foreground tracking-tight">CLASHDATA</span>
          <span>© {new Date().getFullYear()} CLASHDATA. Todos os direitos reservados.</span>
          <Link href="/ranking" className="hover:text-foreground transition-colors">
            Ranking Global
          </Link>
        </div>
      </footer>
    </div>
  );
}
