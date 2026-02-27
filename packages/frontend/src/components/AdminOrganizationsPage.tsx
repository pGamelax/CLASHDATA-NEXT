"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Trash2, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
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
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/organizations`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar organizações:", error);
    } finally {
      setLoading(false);
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizações ({organizations.length})
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
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Nenhuma organização encontrada
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => {
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
                        {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {org.subscription && (
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
