"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, Sparkles, Shield, Search, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOrganizations, useSession } from "@/auth";
import { ClientHeader } from "@/components/ClientHeader";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { fetchClanData } from "@/lib/api";

// Client component para atualizar o título
function TitleUpdater({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}

const organizationSchema = z.object({
  clanTag: z.string().min(1, "Tag do clan é obrigatória").regex(/^#?[A-Z0-9]+$/, "Tag inválida"),
});

type OrganizationSchema = z.infer<typeof organizationSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const PLAN_NAMES = {
  MESTRE: "Mestre",
  CAMPEAO: "Campeão",
  TITA: "Titã",
};

export default function NewOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clanData, setClanData] = useState<any>(null);
  const [clanTag, setClanTag] = useState("");
  const { refetch } = useOrganizations();
  const { data: session } = useSession();

  // Pega plano e período da URL ou localStorage
  const plan = (searchParams.get("plan") || localStorage.getItem("selectedPlan") || "MESTRE") as "MESTRE" | "CAMPEAO" | "TITA";
  const period = (searchParams.get("period") || localStorage.getItem("selectedPeriod") || "monthly") as "monthly" | "quarterly" | "yearly";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrganizationSchema>({
    resolver: zodResolver(organizationSchema),
  });

  const watchedClanTag = watch("clanTag");

  // Busca o clan quando a tag muda
  useEffect(() => {
    const searchClan = async () => {
      if (!watchedClanTag || watchedClanTag.length < 3) {
        setClanData(null);
        return;
      }

      setIsSearching(true);
      setError(null);
      try {
        const cleanTag = watchedClanTag.startsWith("#") ? watchedClanTag.replace("#", "") : watchedClanTag;
        const data = await fetchClanData(cleanTag);
        setClanData(data);
        setClanTag(cleanTag);
      } catch (err) {
        setClanData(null);
        setError("Clan não encontrado. Verifique a tag.");
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchClan, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedClanTag]);

  async function handleCreateOrganization({ clanTag }: OrganizationSchema) {
    if (!clanData) {
      setError("Por favor, busque e selecione um clan válido");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const cleanTag = clanTag.startsWith("#") ? clanTag.replace("#", "") : clanTag;
      
      // Gera nome e slug a partir do nome do clan
      const name = clanData.name || `Clan ${cleanTag}`;
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Cria sessão de checkout no Stripe
      const checkoutResponse = await fetch(`${API_URL}/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          slug,
          plan,
          period,
          clanTag: cleanTag,
        }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.message || "Erro ao criar checkout");
      }

      const checkoutResult = await checkoutResponse.json();

      // Redireciona para o checkout do Stripe
      if (checkoutResult.url) {
        window.location.href = checkoutResult.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar checkout");
    } finally {
      setIsCreating(false);
    }
  }

  // Se não tiver plano, redireciona para pricing
  useEffect(() => {
    if (!plan || !["MESTRE", "CAMPEAO", "TITA"].includes(plan)) {
      router.push("/pricing");
    }
  }, [plan, router]);

  if (!plan || !["MESTRE", "CAMPEAO", "TITA"].includes(plan)) {
    return null;
  }

  return (
    <>
      <TitleUpdater title="Adicionar Clan | CLASHDATA" />
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        <ClientHeader initialUser={session?.user} />
      
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8 text-center">
            <Link 
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Planos
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-primary/5 backdrop-blur-sm px-4 py-2 text-sm mb-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Plano {PLAN_NAMES[plan]}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Adicione seu Clan</h1>
            <p className="text-muted-foreground text-lg">
              Digite a tag do seu clan para começar
            </p>
          </div>

          <form onSubmit={handleSubmit(handleCreateOrganization)}>
            {/* Busca de Clan */}
            <Card className="mb-6 border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  Tag do Clan
                </CardTitle>
                <CardDescription>
                  Digite a tag do seu clan (ex: #ABC123)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...register("clanTag")}
                      placeholder="#ABC123"
                      disabled={isCreating || isSearching}
                      className="h-12 pl-11 border-2 focus-visible:ring-2 focus-visible:ring-primary text-lg font-mono"
                      autoFocus
                    />
                  </div>
                  {errors.clanTag && (
                    <p className="text-sm text-destructive font-medium">{errors.clanTag.message}</p>
                  )}
                  {isSearching && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando clan...
                    </div>
                  )}
                </div>

                {/* Resultado da Busca */}
                {clanData && (
                  <div className="p-4 rounded-xl border-2 border-green-500/30 bg-green-500/5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{clanData.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono mb-2">#{clanData.tag}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Nível: </span>
                            <span className="font-semibold">{clanData.clanLevel}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Membros: </span>
                            <span className="font-semibold">{clanData.members}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && !isSearching && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isCreating || !clanData || isSearching}
                className="flex-1 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Continuar para Pagamento
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/pricing")}
                disabled={isCreating}
                className="h-12 border-2 hover:bg-muted/50 transition-all"
                size="lg"
              >
                Voltar
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para o checkout seguro do Stripe
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
