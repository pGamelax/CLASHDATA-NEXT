"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2 } from "lucide-react";
import { updateOrganization } from "@/lib/api";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  members?: Array<{ id: string; userId: string; role: string }>;
}

export function SettingsContent({ organization }: { organization: Organization }) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isDirty = name !== organization.name || slug !== organization.slug;

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdate = async () => {
    if (!name.trim() || !slug.trim()) {
      return showMessage("error", "Nome e slug são obrigatórios");
    }

    setLoading(true);
    try {
      await updateOrganization(organization.id, { name, slug });
      showMessage("success", "Organização atualizada com sucesso");
      if (slug !== organization.slug) {
        router.push(`/org/${slug}/settings`);
      }
    } catch (err: any) {
      showMessage("error", err.message ?? "Erro ao atualizar organização");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as configurações da organização
        </p>
      </div>

      {/* Feedback */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm border ${
            message.type === "error"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Informações da Organização</CardTitle>
              <CardDescription>Atualize o nome e slug da organização</CardDescription>
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
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
              }
              placeholder="slug-da-organizacao"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              URL da organização: <span className="font-mono">/org/{slug}</span>
            </p>
          </div>
          <Button onClick={handleUpdate} disabled={loading || !isDirty}>
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
    </div>
  );
}
