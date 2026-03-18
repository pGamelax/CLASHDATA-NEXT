"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { authClient } from "../../auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

type Schema = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Schema>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: Schema) {
    setServerError(null);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setServerError(error.message || "Erro ao enviar e-mail");
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 10C4 10 2 10 2 7C2 4 5 4 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 10C20 10 22 10 22 7C22 4 19 4 19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight">
            CLASH<span className="text-primary">DATA</span>
          </span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">E-mail enviado!</h2>
            <p className="text-muted-foreground mt-2 mb-6 text-sm leading-relaxed">
              Enviamos um link de redefinição para{" "}
              <span className="font-semibold text-foreground">{getValues("email")}</span>.
              Verifique sua caixa de entrada (e spam).
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground">Esqueceu sua senha?</h2>
            <p className="text-muted-foreground mt-1 mb-7 text-sm leading-relaxed">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <Mail
                    className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      errors.email ? "text-destructive" : "text-muted-foreground"
                    )}
                  />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="seu@email.com"
                    className={cn(
                      "pl-10 h-11 rounded-xl border bg-muted/30 transition-all",
                      errors.email
                        ? "border-destructive/60 bg-destructive/5 focus-visible:ring-destructive/30"
                        : "border-border focus-visible:ring-primary/30"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive ml-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p className="text-xs text-destructive text-center">{serverError}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
