"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "../../../auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

type Schema = z.infer<typeof schema>;

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Schema>({ resolver: zodResolver(schema) });

  async function onSubmit({ password }: Schema) {
    if (!token) {
      setServerError("Token inválido ou expirado. Solicite um novo link.");
      return;
    }
    setServerError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      setServerError(error.message || "Erro ao redefinir senha");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/sign-in"), 3000);
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

        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Senha redefinida!</h2>
            <p className="text-muted-foreground mt-2 mb-6 text-sm">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </p>
            <Link href="/sign-in" className="text-sm text-primary hover:underline underline-offset-4">
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground">Nova senha</h2>
            <p className="text-muted-foreground mt-1 mb-7 text-sm">
              Escolha uma senha segura para sua conta.
            </p>

            {!token && (
              <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <XCircle className="h-4 w-4 shrink-0" />
                Link inválido ou expirado.{" "}
                <Link href="/forgot-password" className="underline underline-offset-4">
                  Solicitar novo link
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Password */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Lock
                    className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      errors.password ? "text-destructive" : "text-muted-foreground"
                    )}
                  />
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Nova senha"
                    className={cn(
                      "pl-10 pr-10 h-11 rounded-xl border bg-muted/30 transition-all",
                      errors.password
                        ? "border-destructive/60 bg-destructive/5 focus-visible:ring-destructive/30"
                        : "border-border focus-visible:ring-primary/30"
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

              {/* Confirm */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Lock
                    className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      errors.confirm ? "text-destructive" : "text-muted-foreground"
                    )}
                  />
                  <Input
                    {...register("confirm")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirmar nova senha"
                    className={cn(
                      "pl-10 pr-10 h-11 rounded-xl border bg-muted/30 transition-all",
                      errors.confirm
                        ? "border-destructive/60 bg-destructive/5 focus-visible:ring-destructive/30"
                        : "border-border focus-visible:ring-primary/30"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-xs text-destructive ml-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive shrink-0" />
                    {errors.confirm.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p className="text-xs text-destructive text-center">{serverError}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full h-11 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
