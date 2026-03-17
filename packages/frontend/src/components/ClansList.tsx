import {
  Shield,
  Users,
  Trophy,
  BarChart3,
  Home,
  Sword,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    clanLevel?: number;
    members?: number;
    clanPoints?: number;
    badgeUrls?: { small?: string; medium?: string; large?: string };
    warFrequency?: string;
  };
}

interface Organization {
  id: string;
  slug: string;
  name: string;
  members?: Array<{ userId: string; role: string }>;
}

interface ClansListProps {
  organization: Organization;
  clans: Clan[];
  isOwner: boolean;
}

function getClanLevel(clan: Clan) {
  return clan.clanLevel ?? clan.metadata?.clanLevel ?? 0;
}

function getClanMembers(clan: Clan) {
  return clan.members ?? clan.metadata?.members ?? 0;
}

function getClanPoints(clan: Clan) {
  return clan.metadata?.clanPoints ?? 0;
}

function getClanBadge(clan: Clan) {
  return (
    clan.badgeUrls?.medium ??
    clan.badgeUrls?.small ??
    clan.metadata?.badgeUrls?.medium ??
    clan.metadata?.badgeUrls?.small
  );
}

function clanSlug(tag: string) {
  return tag.replace("#", "").toLowerCase();
}

const WAR_FREQ_LABELS: Record<string, string> = {
  always: "Sempre",
  moreThanOncePerWeek: "Freq. Alta",
  oncePerWeek: "1x/semana",
  lessThanOncePerWeek: "Ocasional",
  never: "Nunca",
};

function ClanCard({ clan, orgSlug }: { clan: Clan; orgSlug: string }) {
  const tag = clan.clanTag;
  const slug = clanSlug(tag);
  const badge = getClanBadge(clan);
  const level = getClanLevel(clan);
  const memberCount = getClanMembers(clan);
  const points = getClanPoints(clan);
  const warFreq = clan.metadata?.warFrequency;
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
            <Badge variant="secondary" className="text-xs shrink-0">
              Nv {level}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 pt-0">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {memberCount}/50
          </span>
          {points > 0 && (
            <span className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              {points.toLocaleString()} pts
            </span>
          )}
          {warFreq && WAR_FREQ_LABELS[warFreq] && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
              {WAR_FREQ_LABELS[warFreq]}
            </span>
          )}
        </div>

        {/* Quick access */}
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

export function ClansList({ organization, clans, isOwner }: ClansListProps) {
  const validClans = clans.filter((c) => c.clanTag);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clãs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {validClans.length} {validClans.length === 1 ? "clã cadastrado" : "clãs cadastrados"} em{" "}
            {organization.name}
          </p>
        </div>
        {isOwner && (
          <Button asChild>
            <Link href={`/org/${organization.slug}/clans/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Clã
            </Link>
          </Button>
        )}
      </div>

      {validClans.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {validClans.map((clan) => (
            <ClanCard
              key={clan.id}
              clan={clan}
              orgSlug={organization.slug}
            />
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
  );
}
