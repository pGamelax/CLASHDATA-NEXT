"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail, Loader2, XCircle, User } from "lucide-react";
import { authClient } from "../../auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Client component para atualizar o título
function TitleUpdater({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}

const signUpSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
  name: z.string().min(1, "Nome obrigatório"),
});

type SignUpSchema = z.infer<typeof signUpSchema>;

function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });

  async function handleSignUp({ email, password, name }: SignUpSchema) {
    setServerError(null);

    // Usa o callbackUrl da query string ou /organizations como padrão
    const redirectUrl = callbackUrl || "/organizations";

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: redirectUrl,
      },
      {
        onSuccess: () => {
          router.push(redirectUrl);
          router.refresh();
        },
        onError: (context) => {
          setServerError(context.error.message || "Erro ao criar conta");
        },
      }
    );
  }

  return (
    <>
      <TitleUpdater title="Cadastrar | CLASHDATA" />
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        <div className="relative w-full max-w-md px-6 flex flex-col items-center gap-8">
        <Link href="/" className="flex flex-col items-center gap-3 group">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path
                d="M4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M8 17V13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12 17V11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16 17V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 10C4 10 2 10 2 7C2 4 5 4 5 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M20 10C20 10 22 10 22 7C22 4 19 4 19 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tighter sm:text-3xl text-foreground">
            CLASH<span className="text-primary">DATA</span>
          </h1>
        </Link>

        <Card className="w-full border-2 bg-card/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl lg:text-3xl">Cadastrar</CardTitle>
            <CardDescription>
              Cadastre sua conta para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>

          <form
            onSubmit={handleSubmit(handleSignUp)}
            className="flex flex-col gap-5"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <User
                    className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      errors.name ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    {...register("name")}
                    placeholder="Nome"
                    className={`pl-11 h-12 bg-muted/30 backdrop-blur-sm border-none ring-2 transition-all rounded-xl ${
                      errors.name
                        ? "ring-destructive/50 bg-destructive/5"
                        : "ring-border/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs font-medium text-destructive ml-4 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      errors.email ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="E-mail"
                    className={`pl-11 h-12 bg-muted/30 backdrop-blur-sm border-none ring-2 transition-all rounded-xl ${
                      errors.email
                        ? "ring-destructive/50 bg-destructive/5"
                        : "ring-border/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-destructive ml-4 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      errors.password ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="Senha"
                    className={`pl-11 h-12 bg-muted/30 backdrop-blur-sm border-none ring-2 transition-all rounded-xl ${
                      errors.password
                        ? "ring-destructive/50 bg-destructive/5"
                        : "ring-border/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive ml-4 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {serverError && (
              <Alert variant="destructive">
                <XCircle size={18} />
                <AlertDescription className="font-semibold">{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-5 mt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  href={callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in"}
                  className="font-bold text-primary hover:underline underline-offset-4 transition-colors"
                >
                  Entre agora
                </Link>
              </p>
            </div>
          </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        <div className="w-full max-w-md px-6">
          <Card className="w-full border-2 bg-card/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
