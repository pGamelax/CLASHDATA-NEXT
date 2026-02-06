"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2, CheckCircle2, XCircle, MapPin, Users, Trophy, Shield, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchClanData, createClan, getSession } from "@/lib/api";
import { useOrganizations } from "@/auth";

// Client component para atualizar o título
function TitleUpdater({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}

const searchSchema = z.object({
  tag: z.string().min(1, "Tag do clan é obrigatória"),
});

type SearchSchema = z.infer<typeof searchSchema>;

interface ClanData {
  tag: string;
  name: string;
  description?: string;
  location?: {
    id: number;
    name: string;
    isCountry: boolean;
    countryCode: string;
  };
  badgeUrls?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  clanLevel: number;
  clanPoints: number;
  members: number;
  type: string;
  warFrequency?: string;
  requiredTrophies?: number;
}

export default function NewClanPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.slug as string;
  const { data: organizations } = useOrganizations();
  const orgsList = organizations?.data || organizations || [];
  const organization = Array.isArray(orgsList)
    ? orgsList.find((org: any) => org.slug === orgSlug)
    : null;

  const [clanData, setClanData] = useState<ClanData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchSchema>({
    resolver: zodResolver(searchSchema),
  });

  useEffect(() => {
    async function checkPermissions() {
      try {
        const session = await getSession();
        setCurrentUser(session?.user || null);
        
        if (organization && session?.user) {
          // Verifica se o usuário é owner ou admin
          const member = organization.members?.find(
            (m: any) => m.userId === session.user.id
          );
          const userIsOwner = member?.role === "owner" || session.user.role === "admin";
          setIsOwner(userIsOwner);
          
          if (!userIsOwner) {
            setError("Apenas o dono da organização pode adicionar clans");
            setTimeout(() => {
              router.push(`/org/${orgSlug}`);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (organization) {
      checkPermissions();
    }
  }, [organization, router, orgSlug]);

  async function handleSearch({ tag }: SearchSchema) {
    setIsSearching(true);
    setError(null);
    setClanData(null);

    try {
      const cleanTag = tag.replace("#", "");
      const data = await fetchClanData(cleanTag, undefined, false);
      setClanData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar clan");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCreateClan() {
    if (!clanData || !organization) return;

    setIsCreating(true);
    setError(null);

    try {
      await createClan(organization.id, clanData.tag, {
        name: clanData.name,
        description: clanData.description,
        badgeUrls: clanData.badgeUrls,
        clanLevel: clanData.clanLevel,
        clanPoints: clanData.clanPoints,
        members: clanData.members,
        location: clanData.location,
      });

      // Redireciona para a página da organização
      router.push(`/org/${orgSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar clan");
    } finally {
      setIsCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="border-2 text-center">
          <CardContent className="p-12">
            <p className="text-muted-foreground">Organização não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Apenas o dono da organização pode adicionar clans. Redirecionando...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <TitleUpdater title={organization ? `${organization.name} - Adicionar Clan | CLASHDATA` : "Adicionar Clan | CLASHDATA"} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Adicionar Clan</h1>
          <p className="text-muted-foreground">
            Adicione um novo clan à organização {organization.name}
          </p>
        </div>

      <Card className="border-2 mb-6">
        <CardHeader>
          <CardTitle>Buscar Clan</CardTitle>
          <CardDescription>
            Digite a tag do clan do Clash of Clans para buscar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSearch)} className="space-y-4">
            <div className="flex gap-2">
              <Input
                {...register("tag")}
                placeholder="Ex: #2GPV299QG"
                className="flex-1"
                disabled={isSearching}
              />
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
            {errors.tag && (
              <p className="text-sm text-destructive">{errors.tag.message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {clanData && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Preview do Clan</CardTitle>
            <CardDescription>
              Confirme os dados antes de adicionar à organização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              {clanData.badgeUrls?.large && (
                <Image
                  src={clanData.badgeUrls.large}
                  alt={clanData.name}
                  width={80}
                  height={80}
                  className="rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold">{clanData.name}</h3>
                <p className="text-sm font-mono text-muted-foreground">
                  {clanData.tag}
                </p>
                {clanData.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {clanData.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Nível</p>
                  <p className="font-semibold">{clanData.clanLevel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pontos</p>
                  <p className="font-semibold">
                    {clanData.clanPoints.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Membros</p>
                  <p className="font-semibold">{clanData.members}</p>
                </div>
              </div>
              {clanData.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p className="font-semibold">{clanData.location.name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateClan}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Adicionar à Organização
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setClanData(null);
                  setError(null);
                }}
                disabled={isCreating}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}

