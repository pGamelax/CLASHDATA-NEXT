import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { ClientHeader } from "@/components/ClientHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Swords, Trophy, BarChart3, Zap, Users, TrendingUp, Target } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLASHDATA",
  description: "Plataforma de análise para Clash of Clans",
};

export default async function Home() {
  const cookieStore = await cookies();
  // Converte cookies do Next.js para string de header HTTP
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const session = await getSession(cookieHeader);

  const features = [
    {
      icon: Swords,
      title: "Ranking de Guerras",
      description: "Acompanhe o desempenho dos seus membros em guerras aleatórias com estatísticas detalhadas e rankings precisos.",
    },
    {
      icon: Trophy,
      title: "Ranking CWL",
      description: "Analise o desempenho na Clan War League com dados completos de todas as temporadas e rodadas.",
    },
    {
      icon: Zap,
      title: "Guerra Atual",
      description: "Visualize a guerra em tempo real com previsões, timeline completa e identificação do fechador da guerra.",
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Estatísticas detalhadas, médias bayesianas e métricas de performance para cada jogador.",
    },
    {
      icon: Target,
      title: "Previsões Inteligentes",
      description: "Sistema de previsão de vitória baseado em dados reais e análise estatística avançada.",
    },
    {
      icon: Users,
      title: "Gestão de Organizações",
      description: "Gerencie múltiplos clãs e organizações em um único lugar com controle total.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader initialUser={session?.user} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-20 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-2 text-sm">
              <Zap className="mr-2 h-4 w-4 text-primary" />
              <span>Plataforma de Análise para Clash of Clans</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Gerencie seu Clã com
              <span className="text-primary"> Inteligência</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Análise completa de guerras, rankings detalhados e estatísticas avançadas para tomar as melhores decisões e liderar seu clã ao topo.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              {session?.user ? (
                <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/organizations">Minhas Organizações</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all">
                    <Link href="/sign-up">Começar Agora</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8 h-12 border-2 hover:bg-primary/5 transition-all">
                    <Link href="/sign-in">Entrar</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Recursos Poderosos
          </h2>
          <p className="text-lg text-muted-foreground">
            Tudo que você precisa para gerenciar e analisar o desempenho do seu clã
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative bg-card"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 group-hover:border-primary/40 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-gradient-to-b from-muted/40 via-primary/5 to-muted/40">
        <div className="container mx-auto px-4 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-8 rounded-2xl hover:bg-background/80 hover:shadow-lg transition-all duration-300 border border-border/50">
              <div className="mb-3 text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">100%</div>
              <div className="text-muted-foreground font-semibold">Precisão nas Estatísticas</div>
            </div>
            <div className="text-center p-8 rounded-2xl hover:bg-background/80 hover:shadow-lg transition-all duration-300 border border-border/50">
              <div className="mb-3 text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">24/7</div>
              <div className="text-muted-foreground font-semibold">Monitoramento em Tempo Real</div>
            </div>
            <div className="text-center p-8 rounded-2xl hover:bg-background/80 hover:shadow-lg transition-all duration-300 border border-border/50">
              <div className="mb-3 text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">∞</div>
              <div className="text-muted-foreground font-semibold">Histórico Completo</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 lg:py-28">
        <Card className="border-2 bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
          <CardHeader className="text-center relative z-10">
            <CardTitle className="mb-4 text-3xl font-bold sm:text-4xl">
              Pronto para elevar seu clã?
            </CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto font-medium">
              Comece a usar o ClashData hoje e transforme a forma como você gerencia seu clã.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center relative z-10">
            {session?.user ? (
              <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <Link href="/organizations">Minhas Organizações</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <Link href="/sign-up">Criar Conta Grátis</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
