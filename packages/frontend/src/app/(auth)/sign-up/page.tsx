"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail, Loader2, XCircle, User, Eye, EyeOff, Shield, Trophy, TrendingUp, Gift } from "lucide-react";
import { authClient } from "../../../auth";
import { applyReferralCode } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

function TitleUpdater({ title }: { title: string }) {
  useEffect(() => { document.title = title; }, [title]);
  return null;
}

const signUpSchema = z
  .object({
    email: z.string().email("E-mail inválido"),
    name: z.string().min(1, "Nome obrigatório"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha obrigatória"),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type SignUpSchema = z.infer<typeof signUpSchema>;

// ── Social icons ──────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ── Left panel ────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-linear-to-br from-primary via-primary/95 to-violet-900 flex-col">
      {/* Decorative rings */}
      <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-125 h-125 rounded-full border border-white/10" />
      <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-87.5 h-87.5 rounded-full border border-white/10" />
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-50 h-50 rounded-full border border-white/10" />
      {/* Diagonal lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" aria-hidden>
        <line x1="0" y1="30%" x2="100%" y2="60%" stroke="white" strokeWidth="1" />
        <line x1="0" y1="50%" x2="100%" y2="20%" stroke="white" strokeWidth="1" />
        <line x1="20%" y1="0" x2="60%" y2="100%" stroke="white" strokeWidth="1" />
      </svg>

      {/* Logo */}
      <div className="relative z-10 p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 10C4 10 2 10 2 7C2 4 5 4 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 10C20 10 22 10 22 7C22 4 19 4 19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            CLASH<span className="text-white/60">DATA</span>
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-8">
        <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
          Analise.<br />Domine.<br />Conquiste.
        </h1>
        <p className="mt-5 text-white/65 text-lg max-w-xs leading-relaxed">
          Dados reais de Clash of Clans para levar seu clã ao próximo nível.
        </p>

        {/* Feature highlights */}
        <div className="mt-10 space-y-4">
          {[
            { icon: Shield, text: "Gestão completa de clãs e membros" },
            { icon: Trophy, text: "Ranking e desempenho em guerras" },
            { icon: TrendingUp, text: "Estatísticas detalhadas em tempo real" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/15 shrink-0">
                <Icon className="h-4 w-4 text-white/80" />
              </div>
              <span className="text-white/75 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-violet-900/50 to-transparent pointer-events-none" />
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────
function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const refCode = searchParams.get("ref");
  const redirectUrl = callbackUrl || "/clans";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { referralCode: refCode || "" },
  });

  async function handleSignUp({ email, password, name, referralCode }: SignUpSchema) {
    setServerError(null);
    await authClient.signUp.email(
      { email, password, name, callbackURL: redirectUrl },
      {
        onSuccess: async () => {
          if (referralCode?.trim()) {
            try {
              await applyReferralCode(referralCode.trim());
            } catch {
              // Código inválido não impede o cadastro
            }
          }
          router.push(redirectUrl);
          router.refresh();
        },
        onError: (ctx) => setServerError(ctx.error.message || "Erro ao criar conta"),
      }
    );
  }

  async function handleSocial(provider: "google") {
    setSocialLoading(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}${redirectUrl}`,
      });
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <>
      <TitleUpdater title="Cadastrar | CLASHDATA" />
      <div className="min-h-screen flex">
        <LeftPanel />

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background overflow-y-auto">
          <div className="w-full max-w-sm py-6">

            {/* Mobile logo */}
            <div className="lg:hidden mb-8 flex items-center gap-3">
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

            <h2 className="text-2xl font-bold text-foreground">Criar conta</h2>
            <p className="text-muted-foreground mt-1 mb-7 text-sm">
              Cadastre-se gratuitamente para começar.
            </p>

            {/* Social buttons */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => handleSocial("google")}
                disabled={!!socialLoading}
                className={cn(
                  "flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-border bg-muted/40",
                  "hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                )}
              >
                {socialLoading === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <GoogleIcon />
                )}
                Continuar com Google
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wider">
                  ou continue com e-mail
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(handleSignUp)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <div className="relative">
                  <User className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", errors.name ? "text-destructive" : "text-muted-foreground")} />
                  <Input
                    {...register("name")}
                    placeholder="Nome"
                    className={cn(
                      "pl-10 h-11 rounded-xl border bg-muted/30 transition-all",
                      errors.name ? "border-destructive/60 bg-destructive/5" : "border-border focus-visible:ring-primary/30"
                    )}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-destructive ml-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive shrink-0" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Mail className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", errors.email ? "text-destructive" : "text-muted-foreground")} />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="E-mail"
                    className={cn(
                      "pl-10 h-11 rounded-xl border bg-muted/30 transition-all",
                      errors.email ? "border-destructive/60 bg-destructive/5" : "border-border focus-visible:ring-primary/30"
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

              {/* Password */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", errors.password ? "text-destructive" : "text-muted-foreground")} />
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    className={cn(
                      "pl-10 pr-10 h-11 rounded-xl border bg-muted/30 transition-all",
                      errors.password ? "border-destructive/60 bg-destructive/5" : "border-border focus-visible:ring-primary/30"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive ml-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", errors.confirmPassword ? "text-destructive" : "text-muted-foreground")} />
                  <Input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmar senha"
                    className={cn(
                      "pl-10 pr-10 h-11 rounded-xl border bg-muted/30 transition-all",
                      errors.confirmPassword ? "border-destructive/60 bg-destructive/5" : "border-border focus-visible:ring-primary/30"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive ml-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive shrink-0" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Referral code */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("referralCode")}
                    placeholder="Código de indicação (opcional)"
                    className="pl-10 h-11 rounded-xl border bg-muted/30 transition-all border-border focus-visible:ring-primary/30 uppercase"
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                      register("referralCode").onChange(e);
                    }}
                  />
                </div>
              </div>

              {serverError && (
                <Alert variant="destructive" className="py-2.5">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium text-sm">{serverError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Cadastrando...</> : "Criar conta"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                href={callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in"}
                className="font-semibold text-primary hover:underline underline-offset-4 transition-colors"
              >
                Entre agora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
