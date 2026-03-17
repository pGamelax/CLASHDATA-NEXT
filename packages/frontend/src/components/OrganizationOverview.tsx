import {
  Shield,
  Users,
  BarChart3,
  Crown,
  Plus,
  Sword,
  Trophy,
  Home,
  ChevronRight,
  Settings,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Clan {
  id: string;
  name: string;
  clanTag: string;
  clanLevel?: number;
  members?: number;
  badgeUrls?: { small?: string; medium?: string; large?: string } | null;
  metadata?: {
    name?: string;
    clanLevel?: number;
    members?: number;
    badgeUrls?: { small?: string; medium?: string; large?: string };
    warFrequency?: string;
    type?: string;
  };
}

interface OrgMember {
  userId: string;
  role: string;
  user?: { name?: string | null; email?: string };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  members?: OrgMember[];
  subscription?: { plan?: string; status?: string } | null;
  clans: Clan[];
}

interface Props {
  organization: Organization;
  isOwner: boolean;
}

function clanSlug(tag: string) {
  return tag.replace("#", "").toLowerCase();
}

function getClanLevel(clan: Clan): number {
  return clan.clanLevel ?? clan.metadata?.clanLevel ?? 0;
}

function getClanMembers(clan: Clan): number {
  return clan.members ?? clan.metadata?.members ?? 0;
}

function getClanBadge(clan: Clan): string | undefined {
  return (
    clan.badgeUrls?.medium ??
    clan.badgeUrls?.small ??
    clan.metadata?.badgeUrls?.medium ??
    clan.metadata?.badgeUrls?.small
  );
}

function PlanBadge({ plan }: { plan?: string | null }) {
  const label = plan?.toUpperCase() ?? "FREE";
  const styles: Record<string, string> = {
    FREE: "bg-muted text-muted-foreground border-border",
    PRO: "bg-primary/10 text-primary border-primary/30",
    ENTERPRISE: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[label] ?? styles.FREE}`}
    >
      <Star className="h-3 w-3" />
      {label}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function ClanCard({ clan, orgSlug }: { clan: Clan; orgSlug: string }) {
  const tag = clan.clanTag;
  const slug = clanSlug(tag);
  const badge = getClanBadge(clan);
  const level = getClanLevel(clan);
  const memberCount = getClanMembers(clan);
  const base = `/org/${orgSlug}/${slug}`;

  const quickLinks = [
    { href: base, label: "Dashboard", icon: Home },
    { href: `${base}/current-war`, label: "Guerra", icon: Sword },
    { href: `${base}/current-cwl`, label: "CWL", icon: Trophy },
    { href: `${base}/random-ranking`, label: "Ranking", icon: BarChart3 },
  ];

  return (
    <Card className="group flex flex-col hover:border-primary/50 transition-colors duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {badge ? (
              <img src={badge} alt={clan.name} className="h-10 w-10 object-contain" />
            ) : (
              <Shield className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate leading-tight">{clan.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{tag}</p>
          </div>
          {level > 0 && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Nv {level}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 pt-0">
        {/* Members stat */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{memberCount}/50 membros</span>
        </div>

        {/* Quick access links */}
        <div className="grid grid-cols-4 gap-1 rounded-lg border p-1">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted transition-colors text-center"
              title={label}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
            </Link>
          ))}
        </div>

        {/* Main CTA */}
        <Button asChild variant="outline" size="sm" className="w-full mt-auto">
          <Link href={base} className="flex items-center justify-between">
            <span>Ver Dashboard</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function OrganizationOverview({ organization, isOwner }: Props) {
  const clans = organization.clans ?? [];
  const orgMembers = organization.members ?? [];

  const totalClanMembers = clans.reduce((sum, c) => sum + getClanMembers(c), 0);
  const avgLevel =
    clans.length > 0
      ? Math.round(clans.reduce((sum, c) => sum + getClanLevel(c), 0) / clans.length)
      : 0;

  return (
    <div className="space-y-8">
      {/* Org header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <Crown className="h-7 w-7 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold leading-tight">{organization.name}</h1>
              <PlanBadge plan={organization.subscription?.plan} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">/{organization.slug}</p>
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href={`/org/${organization.slug}/settings`}>
                <Settings className="h-4 w-4 mr-1.5" />
                Configurações
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/org/${organization.slug}/clans/new`}>
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar Clã
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Clãs"
          value={clans.length}
          description="Clãs cadastrados"
          icon={Shield}
        />
        <StatCard
          title="Jogadores"
          value={totalClanMembers}
          description="Membros nos clãs"
          icon={Users}
        />
        <StatCard
          title="Administradores"
          value={orgMembers.length}
          description="Membros da organização"
          icon={Crown}
        />
        <StatCard
          title="Nível Médio"
          value={avgLevel || "—"}
          description="Dos clãs cadastrados"
          icon={BarChart3}
        />
      </div>

      {/* Clan grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Clãs</h2>
          {clans.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/org/${organization.slug}/clans`} className="flex items-center gap-1">
                Gerenciar
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {clans.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clans
              .filter((c) => c.clanTag)
              .map((clan) => (
                <ClanCard key={clan.id} clan={clan} orgSlug={organization.slug} />
              ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Shield className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">Nenhum clã cadastrado</p>
              <p className="text-sm text-muted-foreground mb-6">
                Adicione o primeiro clã para começar a usar o dashboard
              </p>
              {isOwner && (
                <Button asChild>
                  <Link href={`/org/${organization.slug}/clans/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Clã
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Members quick view */}
      {isOwner && orgMembers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Membros da Organização</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/org/${organization.slug}/members`} className="flex items-center gap-1">
                Gerenciar
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {orgMembers.slice(0, 8).map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm"
              >
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-3 w-3 text-primary" />
                </div>
                <span className="text-muted-foreground">
                  {member.user?.name ?? member.user?.email ?? "Membro"}
                </span>
                {member.role === "owner" && (
                  <Crown className="h-3 w-3 text-amber-500" />
                )}
              </div>
            ))}
            {orgMembers.length > 8 && (
              <Link
                href={`/org/${organization.slug}/members`}
                className="flex items-center px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                +{orgMembers.length - 8} mais
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
