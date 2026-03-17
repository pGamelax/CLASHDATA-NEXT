"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  PLAN_NAMES,
  PLAN_ICONS,
  PLAN_COLORS,
  PLAN_LIMITS,
  PLAN_PRICES_CENTS,
  PERIOD_NAMES,
  PERIOD_LABELS,
  formatBRL,
  type Plan,
  type Period,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.clashdata.pro";

const schema = z.object({
  name: z
    .string()
    .min(1, "Nome da organização é obrigatório")
    .max(100, "Nome muito longo"),
});

type FormData = z.infer<typeof schema>;

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface Props {
  plan: Plan;
  period: Period;
}

export function NewOrgContent({ plan, period }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Icon = PLAN_ICONS[plan];
  const colors = PLAN_COLORS[plan];
  const limits = PLAN_LIMITS[plan];
  const price = PLAN_PRICES_CENTS[plan][period];
  const months = period === "monthly" ? 1 : period === "quarterly" ? 3 : 12;
  const monthlyEquiv = price.amount / months;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit({ name }: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/stripe/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, slug: slugify(name), plan, period }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao criar checkout");
      }

      const { url } = await res.json();
      if (!url) throw new Error("URL de checkout não retornada");

      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar checkout");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-10 max-w-lg">

        {/* Back */}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Planos
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Criar Organização</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha um nome para sua organização e prossiga para o pagamento
          </p>
        </div>

        <div className="space-y-4">
          {/* Plan summary */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br border-2", colors.gradient, colors.border)}>
                    <Icon className={cn("h-5 w-5", colors.icon)} />
                  </div>
                  <div>
                    <CardTitle className="text-base">Plano {PLAN_NAMES[plan]}</CardTitle>
                    <CardDescription>{PERIOD_NAMES[period]}</CardDescription>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {price.originalAmount && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatBRL(price.originalAmount)}
                    </p>
                  )}
                  <p className="font-bold text-base">{formatBRL(price.amount)}</p>
                  <p className="text-xs text-muted-foreground">/{PERIOD_LABELS[period]}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                {period !== "monthly" && (
                  <span className="text-xs">
                    {formatBRL(monthlyEquiv)}/mês equivalente
                  </span>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <span>{limits.maxClans} {limits.maxClans === 1 ? "clã" : "clãs"}</span>
                  <span>·</span>
                  <span>{limits.maxInvites} {limits.maxInvites === 1 ? "convite" : "convites"}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-0">
                  3 dias grátis
                </Badge>
                <span>Cancele quando quiser</span>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nome da Organização</CardTitle>
                <CardDescription>
                  Escolha um nome único para identificar sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Nome</Label>
                  <Input
                    id="org-name"
                    {...register("name")}
                    placeholder="Minha Organização"
                    disabled={isSubmitting}
                    className="h-11"
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11"
                  size="lg"
                >
                  {isSubmitting ? (
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
              </CardContent>
            </Card>
          </form>

          {/* Stripe note */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Pagamento processado com segurança pelo Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
