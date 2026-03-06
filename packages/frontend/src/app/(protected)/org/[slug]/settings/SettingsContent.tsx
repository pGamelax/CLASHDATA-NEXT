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
  Loader2,
  Shield
} from "lucide-react";
import { 
  updateOrganization, 
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
      if (slug !== organization.slug) {
        router.push(`/org/${slug}/settings`);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao atualizar organização" });
    } finally {
      setLoading(false);
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

        {}
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

        {}
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
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
  );
}
