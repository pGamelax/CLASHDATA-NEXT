"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Save, 
  Trash2, 
  AlertTriangle, 
  Loader2,
  Shield,
  X
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { 
  updateOrganization, 
  deleteOrganization, 
  removeClan,
  getSession 
} from "@/lib/api";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  members?: Array<{
    id: string;
    userId: string;
    role: string;
  }>;
  clans?: Array<{
    id: string;
    name: string;
    tag: string;
    clanTag?: string;
  }>;
}

export function SettingsContent({ organization: initialOrganization }: { organization: Organization }) {
  const router = useRouter();
  const [organization, setOrganization] = useState(initialOrganization);
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingClan, setRemovingClan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadOrganizationData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const orgResponse = await fetch(
        `${API_URL}/organizations/${organization.id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        }
      );

      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        if (orgData.organization) {
          setOrganization({
            ...organization,
            members: orgData.organization.members || [],
            clans: orgData.organization.clans || [],
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar organização:", error);
    }
  };

  useEffect(() => {
    async function loadData() {
      const session = await getSession();
      setCurrentUser(session?.user || null);
      await loadOrganizationData();
    }
    loadData();
  }, [organization.id]);

  const isAdmin = currentUser?.role === "admin";
  const isOwner = (organization.members || []).some(
    (m: any) => m.userId === currentUser?.id && m.role === "owner"
  ) || isAdmin;

  // Se não for owner, redireciona
  useEffect(() => {
    if (currentUser && !isOwner) {
      router.push(`/org/${organization.slug}`);
    }
  }, [currentUser, isOwner, router, organization.slug]);

  const handleUpdate = async () => {
    if (!name.trim() || !slug.trim()) {
      setMessage({ type: "error", text: "Nome e slug são obrigatórios" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await updateOrganization(organization.id, { name, slug });
      setMessage({ type: "success", text: "Organização atualizada com sucesso" });
      setOrganization({ ...organization, name, slug });
      // Atualiza a URL se o slug mudou
      if (slug !== organization.slug) {
        router.push(`/org/${slug}/settings`);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao atualizar organização" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setMessage(null);

    try {
      await deleteOrganization(organization.id);
      router.push("/organizations");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao deletar organização" });
      setDeleting(false);
    }
  };

  const handleRemoveClan = async (clanId: string) => {
    setRemovingClan(clanId);
    setMessage(null);

    try {
      await removeClan(clanId);
      setMessage({ type: "success", text: "Clan removido com sucesso" });
      // Atualiza a lista de clans
      setOrganization({
        ...organization,
        clans: organization.clans?.filter((c) => c.id !== clanId) || [],
      });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao remover clan" });
    } finally {
      setRemovingClan(null);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
            Gerencie as configurações da organização
          </p>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Informações da Organização */}
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Informações da Organização</CardTitle>
                <CardDescription>
                  Atualize o nome e slug da organização
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da organização"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="slug-da-organizacao"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                O slug será usado na URL: /org/{slug}
              </p>
            </div>
            <Button
              onClick={handleUpdate}
              disabled={loading || (name === organization.name && slug === organization.slug)}
              className="w-full sm:w-auto shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Clans */}
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Clans</CardTitle>
                <CardDescription>
                  Gerencie os clans da organização
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!organization.clans || organization.clans.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum clan cadastrado</p>
                </div>
              ) : (
                organization.clans.map((clan) => (
                  <div
                    key={clan.id}
                    className="flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{clan.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">
                        #{clan.tag || clan.clanTag}
                      </p>
                    </div>
                    <ConfirmationDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={removingClan === clan.id}
                        >
                          {removingClan === clan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      }
                      title="Remover Clan"
                      description={`Tem certeza que deseja remover o clan "${clan.name}"? Esta ação não pode ser desfeita.`}
                      confirmationText={clan.name}
                      onConfirm={() => handleRemoveClan(clan.id)}
                      confirmButtonText="Remover Clan"
                      confirmButtonVariant="destructive"
                      disabled={removingClan === clan.id}
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Zona de Perigo - apenas para admin (deleção de organização) */}
        {isAdmin && (
          <Card className="border-2 border-destructive/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                  <CardDescription>
                    Ações irreversíveis. Use com cuidado.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ConfirmationDialog
                trigger={
                  <Button
                    variant="destructive"
                    disabled={deleting}
                    className="w-full sm:w-auto shrink-0"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar Organização
                      </>
                    )}
                  </Button>
                }
                title="Deletar Organização"
                description={
                  <>
                    Esta ação não pode ser desfeita. Isso deletará permanentemente a organização "{organization.name}" e todos os dados associados, incluindo:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Todos os membros</li>
                      <li>Todos os clans</li>
                      <li>Todos os convites</li>
                      <li>A assinatura</li>
                    </ul>
                  </>
                }
                confirmationText={organization.name}
                onConfirm={handleDelete}
                confirmButtonText="Deletar Organização"
                confirmButtonVariant="destructive"
                disabled={deleting}
              />
            </CardContent>
          </Card>
        )}
      </div>
  );
}
