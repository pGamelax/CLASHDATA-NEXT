"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, CreditCard, Shield, TrendingUp, AlertCircle, Plus, X, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

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

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, subsRes, orgsRes, usersRes] = await Promise.all([
        fetch(`${apiUrl}/admin/stats`, { credentials: "include" }),
        fetch(`${apiUrl}/admin/subscriptions`, { credentials: "include" }),
        fetch(`${apiUrl}/admin/organizations`, { credentials: "include" }),
        fetch(`${apiUrl}/admin/users`, { credentials: "include" }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscriptions(subsData.data || []);
      }

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(orgsData.data || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      if (!orgName || !orgSlug) {
        setCreateError("Nome e slug são obrigatórios");
        return;
      }

      const response = await fetch(`${apiUrl}/admin/organizations/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar organização");
      }

      const result = await response.json();
      const organizationId = result.organization?.id;

      // Fecha o modal e recarrega os dados
      setShowCreateModal(false);
      setOrgName("");
      setOrgSlug("");
      await fetchData();
      
      // Dispara evento para atualizar a lista de organizações no Header
      if (organizationId) {
        window.dispatchEvent(new CustomEvent("organizationCreated", {
          detail: { organizationId }
        }));
      }
      
      router.refresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Erro ao criar organização");
    } finally {
      setCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setOrgName(name);
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(name));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center text-muted-foreground">
          Erro ao carregar dados do dashboard
        </div>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, organizações e assinaturas
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Organização
        </Button>
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Criar Organização</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCreateModal(false);
                    setOrgName("");
                    setOrgSlug("");
                    setCreateError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Crie uma organização permanente sem necessidade de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Nome da Organização</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Minha Organização"
                    disabled={creating}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgSlug">Slug</Label>
                  <Input
                    id="orgSlug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="ex: minha-organizacao"
                    disabled={creating}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL amigável da organização (será usado na URL)
                  </p>
                </div>

                {createError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setOrgName("");
                      setOrgSlug("");
                      setCreateError(null);
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
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

      {/* Subscription Status Cards */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="organizations">Organizações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle>Organizações sem Assinatura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.organizations.withoutSubscription}</div>
              <p className="text-sm text-muted-foreground">
                Organizações criadas por admins ou sem subscription
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organização</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
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
                        {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Organizações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Clans</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.slug}</TableCell>
                      <TableCell>
                        {org.subscription ? getPlanBadge(org.subscription.plan) : (
                          <Badge variant="outline">Sem plano</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {org.subscription ? getStatusBadge(org.subscription.status) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>{org._count?.members || 0}</TableCell>
                      <TableCell>{org._count?.clans || 0}</TableCell>
                      <TableCell>
                        {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organizações</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user._count?.members || 0}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
