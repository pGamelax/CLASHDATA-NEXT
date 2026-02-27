"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/admin/subscriptions`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar assinaturas:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: "bg-green-500/10 text-green-500",
      TRIAL: "bg-blue-500/10 text-blue-500",
      EXPIRED: "bg-red-500/10 text-red-500",
      CANCELLED: "bg-gray-500/10 text-gray-500",
    };
    return (
      <Badge className={variants[status] || "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planNames: Record<string, string> = {
      MESTRE: "Mestre",
      CAMPEAO: "Campeão",
      TITA: "Titã",
    };
    return (
      <Badge variant="outline">
        {planNames[plan] || plan}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Assinaturas</h1>
        <p className="text-muted-foreground">
          Lista de todas as assinaturas do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinaturas ({subscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma assinatura encontrada
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.organization?.name || "N/A"}
                    </TableCell>
                    <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {sub.trialEndsAt
                        ? new Date(sub.trialEndsAt).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
