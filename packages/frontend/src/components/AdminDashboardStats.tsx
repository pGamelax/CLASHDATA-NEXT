"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CreditCard, Shield, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  users: {
    total: number;
    thisMonth: number;
  };
  organizations: {
    total: number;
    thisMonth: number;
    withoutSubscription: number;
  };
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    expired: number;
    cancelled: number;
    byPlan: Array<{
      plan: string;
      count: number;
    }>;
  };
  clans: {
    total: number;
  };
}

export function AdminDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/admin/stats`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-muted-foreground">
        Erro ao carregar dados do dashboard
      </div>
    );
  }

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema
        </p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.users.thisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizações</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.organizations.thisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.subscriptions.trial} em trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clans</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clans.total}</div>
            <p className="text-xs text-muted-foreground">
              Total cadastrado
            </p>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-green-500">{stats.subscriptions.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trial</p>
                <p className="text-2xl font-bold text-blue-500">{stats.subscriptions.trial}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiradas</p>
                <p className="text-2xl font-bold text-red-500">{stats.subscriptions.expired}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold text-gray-500">{stats.subscriptions.cancelled}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.subscriptions.byPlan.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <span>{getPlanBadge(item.plan)}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizações sem Assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.organizations.withoutSubscription}</div>
            <p className="text-sm text-muted-foreground">
              Organizações criadas por admins ou sem subscription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-bold">{stats.subscriptions.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ativas</span>
                <span className="font-bold text-green-500">{stats.subscriptions.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expiradas</span>
                <span className="font-bold text-red-500">{stats.subscriptions.expired}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Canceladas</span>
                <span className="font-bold text-gray-500">{stats.subscriptions.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
