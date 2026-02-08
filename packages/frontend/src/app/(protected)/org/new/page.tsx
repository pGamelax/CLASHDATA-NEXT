"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, Sparkles, Shield, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOrganizations, useSession } from "@/auth";
import { ClientHeader } from "@/components/ClientHeader";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// Client component para atualizar o título
function TitleUpdater({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}

const organizationSchema = z.object({
  name: z.string().min(1, "Nome da organização é obrigatório").max(100, "Nome muito longo"),
  customClansCount: z.number().min(1).max(50).optional(),
});

type OrganizationSchema = z.infer<typeof organizationSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const PLAN_NAMES = {
  MESTRE: "Mestre",
  CAMPEAO: "Campeão",
  TITA: "Titã",
  LEGEND: "Legend",
};

export default function NewOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Pega plano e período da URL ou localStorage
  const plan = (searchParams.get("plan") || localStorage.getItem("selectedPlan") || "MESTRE") as "MESTRE" | "CAMPEAO" | "TITA" | "LEGEND";
  const period = (searchParams.get("period") || localStorage.getItem("selectedPeriod") || "monthly") as "monthly" | "quarterly" | "yearly";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationSchema>({
    resolver: zodResolver(organizationSchema),
  });

  async function handleCreateOrganization({ name }: OrganizationSchema) {
    setIsCreating(true);
    setError(null);

    try {
      // Gera slug a partir do nome da organização
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
    if (!plan || !["MESTRE", "CAMPEAO", "TITA", "LEGEND"].includes(plan)) {
      router.push("/pricing");
    }
  }, [plan, router]);

  if (!plan || !["MESTRE", "CAMPEAO", "TITA", "LEGEND"].includes(plan)) {
    return null;
  }

  return (
    <>
      <TitleUpdater title="Criar Organização | CLASHDATA" />
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
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Crie sua Organização</h1>
            <p className="text-muted-foreground text-lg">
              Digite o nome da sua organização
            </p>
          </div>

          <form onSubmit={handleSubmit(handleCreateOrganization)}>
            {/* Nome da Organização */}
            <Card className="mb-6 border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  Nome da Organização
                </CardTitle>
                <CardDescription>
                  Escolha um nome para sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    {...register("name")}
                    placeholder="Minha Organização"
                    disabled={isCreating}
                    className="h-12 border-2 focus-visible:ring-2 focus-visible:ring-primary text-lg"
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

           

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all order-2 sm:order-1"
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
                    <span className="hidden sm:inline">Continuar para Pagamento</span>
                    <span className="sm:hidden">Continuar</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/pricing")}
                disabled={isCreating}
                className="h-12 border-2 hover:bg-muted/50 transition-all order-1 sm:order-2"
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
