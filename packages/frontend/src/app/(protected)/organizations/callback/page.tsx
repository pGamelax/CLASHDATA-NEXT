"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/auth";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function StripeCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled");
  const { data: session } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (canceled === "true") {
      setStatus("error");
      setMessage("Checkout cancelado. Sua organização foi criada com trial de 3 dias.");
      return;
    }

    if (sessionId) {
      fetch(`${API_URL}/stripe/checkout-session?session_id=${sessionId}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.payment_status === "paid" || data.payment_status === "unpaid") {
            setStatus("success");
            setMessage("Checkout concluído com sucesso! Sua organização está ativa.");
            setTimeout(() => {
              router.push("/organizations");
            }, 3000);
          } else {
            setStatus("error");
            setMessage("Erro ao processar checkout. Entre em contato com o suporte.");
          }
        })
        .catch((error) => {
          console.error("Erro ao verificar checkout:", error);
          setStatus("error");
          setMessage("Erro ao verificar status do checkout.");
        });
    } else {
      setStatus("error");
      setMessage("Sessão de checkout não encontrada.");
    }
  }, [sessionId, canceled, router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              {status === "loading" && "Processando..."}
              {status === "success" && "Sucesso!"}
              {status === "error" && "Erro"}
            </CardTitle>
            <CardDescription className="text-center">{message}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
            {status !== "loading" && (
              <Button asChild className="w-full">
                <Link href="/organizations">Voltar para Organizações</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
