"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Trash2, XCircle, Edit, Search, Plus, RotateCcw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOrganizationWithManualSubscription, reactivateSubscription } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function AdminOrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
    plan: "MESTRE",
    daysUntilExpiry: 30,
  });
  const [reactivateForm, setReactivateForm] = useState({
    daysUntilExpiry: 30,
  });
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [reactivatingOrg, setReactivatingOrg] = useState<any | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = organizations.filter(
        (org) =>
          org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    } else {
      setFilteredOrganizations(organizations);
    }
  }, [searchTerm, organizations]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/organizations`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.data || []);
        setFilteredOrganizations(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar organizações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrganization = (org: any) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name || "",
      slug: org.slug || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveOrganization = async () => {
    if (!editingOrg) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/admin/organizations/${editingOrg.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchOrganizations();
        setEditDialogOpen(false);
        setEditingOrg(null);
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || "Erro ao atualizar organização");
      }
    } catch (error) {
      alert("Erro ao atualizar organização");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async (organizationId: string) => {
    try {
      setDeleting(organizationId);
      const response = await fetch(`${API_URL}/admin/organizations/${organizationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchOrganizations();
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || "Erro ao excluir organização");
      }
    } catch (error) {
      alert("Erro ao excluir organização");
    } finally {
      setDeleting(null);
    }
  };

  const handleCancelSubscription = async (organizationId: string) => {
    try {
      setCancelling(organizationId);
      const response = await fetch(`${API_URL}/admin/organizations/${organizationId}/cancel-subscription`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        await fetchOrganizations();
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || "Erro ao cancelar assinatura");
      }
    } catch (error) {
      alert("Erro ao cancelar assinatura");
    } finally {
      setCancelling(null);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      setCreating(true);
      await createOrganizationWithManualSubscription(createForm);
      await fetchOrganizations();
      setCreateDialogOpen(false);
      setCreateForm({
        name: "",
        slug: "",
        ownerEmail: "",
        plan: "MESTRE",
        daysUntilExpiry: 30,
      });
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erro ao criar organização");
    } finally {
      setCreating(false);
    }
  };

  const handleReactivateSubscription = async (org: any) => {
    setReactivatingOrg(org);
    setReactivateForm({ daysUntilExpiry: 30 });
    setReactivateDialogOpen(true);
  };

  const handleConfirmReactivate = async () => {
    if (!reactivatingOrg) return;

    try {
      setReactivating(reactivatingOrg.id);
      await reactivateSubscription(reactivatingOrg.id, reactivateForm.daysUntilExpiry);
      await fetchOrganizations();
      setReactivateDialogOpen(false);
      setReactivatingOrg(null);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erro ao reativar assinatura");
    } finally {
      setReactivating(null);
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
        <h1 className="text-3xl font-bold mb-2">Organizações</h1>
        <p className="text-muted-foreground">
          Gerencie todas as organizações, seus donos e membros
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredOrganizations.length} de {organizations.length} organizações
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Organização
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Organização com Assinatura Manual</DialogTitle>
                  <DialogDescription>
                    Crie uma organização com assinatura manual (valor 0,00) para um usuário específico
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Nome da Organização</Label>
                    <Input
                      id="create-name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Ex: Meu Clã"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-slug">Slug</Label>
                    <Input
                      id="create-slug"
                      value={createForm.slug}
                      onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                      placeholder="Ex: meu-cla"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-email">Email do Dono</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={createForm.ownerEmail}
                      onChange={(e) => setCreateForm({ ...createForm, ownerEmail: e.target.value })}
                      placeholder="usuario@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-plan">Plano</Label>
                    <Select
                      value={createForm.plan}
                      onValueChange={(value) => setCreateForm({ ...createForm, plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MESTRE">Mestre</SelectItem>
                        <SelectItem value="CAMPEAO">Campeão</SelectItem>
                        <SelectItem value="TITA">Titã</SelectItem>
                        <SelectItem value="LEGEND">Legend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-days">Dias até Expiração</Label>
                    <Input
                      id="create-days"
                      type="number"
                      min="1"
                      value={createForm.daysUntilExpiry}
                      onChange={(e) => setCreateForm({ ...createForm, daysUntilExpiry: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateOrganization} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizações ({filteredOrganizations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dono</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Clans</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    Nenhuma organização encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => {
                  const owner = org.members?.find((m: any) => m.role === "owner");
                  const memberCount = org._count?.members || 0;
                  const clanCount = org._count?.clans || 0;

                  return (
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
                      <TableCell>
                        {owner ? (
                          <div>
                            <div className="font-medium">{owner.user?.name || "N/A"}</div>
                            <div className="text-xs text-muted-foreground">{owner.user?.email}</div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{memberCount}</TableCell>
                      <TableCell>{clanCount}</TableCell>
                      <TableCell>
                        {org.subscription?.currentPeriodEnd ? (
                          <div>
                            <div>{new Date(org.subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}</div>
                            {org.subscription.paymentProvider === "manual" && (
                              <div className="text-xs text-muted-foreground">Manual</div>
                            )}
                          </div>
                        ) : org.subscription?.trialEndsAt ? (
                          <div>
                            <div>{new Date(org.subscription.trialEndsAt).toLocaleDateString("pt-BR")}</div>
                            <div className="text-xs text-muted-foreground">Trial</div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog open={editDialogOpen && editingOrg?.id === org.id} onOpenChange={(open) => {
                            if (!open) {
                              setEditDialogOpen(false);
                              setEditingOrg(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOrganization(org)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Organização</DialogTitle>
                                <DialogDescription>
                                  Atualize as informações da organização
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="org-name">Nome</Label>
                                  <Input
                                    id="org-name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="org-slug">Slug</Label>
                                  <Input
                                    id="org-slug"
                                    value={editForm.slug}
                                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditDialogOpen(false);
                                    setEditingOrg(null);
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button onClick={handleSaveOrganization} disabled={saving}>
                                  {saving ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Salvando...
                                    </>
                                  ) : (
                                    "Salvar"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {org.subscription && (
                            <>
                              {(org.subscription.status === "EXPIRED" || org.subscription.status === "CANCELLED") && 
                               org.subscription.paymentProvider === "manual" && (
                                <Dialog open={reactivateDialogOpen && reactivatingOrg?.id === org.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setReactivateDialogOpen(false);
                                    setReactivatingOrg(null);
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleReactivateSubscription(org)}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reativar Assinatura</DialogTitle>
                                      <DialogDescription>
                                        Reative a assinatura manual da organização "{org.name}" após pagamento
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="reactivate-days">Dias até Expiração</Label>
                                        <Input
                                          id="reactivate-days"
                                          type="number"
                                          min="1"
                                          value={reactivateForm.daysUntilExpiry}
                                          onChange={(e) => setReactivateForm({ daysUntilExpiry: parseInt(e.target.value) || 30 })}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => {
                                        setReactivateDialogOpen(false);
                                        setReactivatingOrg(null);
                                      }}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={handleConfirmReactivate} disabled={reactivating === org.id}>
                                        {reactivating === org.id ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Reativando...
                                          </>
                                        ) : (
                                          "Reativar"
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={cancelling === org.id}
                                  >
                                    {cancelling === org.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja cancelar a assinatura da organização "{org.name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleCancelSubscription(org.id)}
                                    >
                                      Confirmar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleting === org.id}
                              >
                                {deleting === org.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Organização</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a organização "{org.name}"? Esta ação não pode ser desfeita e excluirá todos os dados relacionados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteOrganization(org.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
