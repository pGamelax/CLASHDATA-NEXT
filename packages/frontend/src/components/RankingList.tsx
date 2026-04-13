"use client";

import { useState, useRef, ReactNode } from "react";
import { toPng } from "html-to-image";
import { Search, Copy, Check, ChevronDown, ChevronUp, Star, Flame, Swords, Target, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Tip({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <div tabIndex={0} className={cn("relative group/tip outline-none", className)}>
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 opacity-0 group-hover/tip:opacity-100 group-focus/tip:opacity-100 transition-opacity">
        <div className="rounded bg-popover border px-2 py-1 text-xs text-popover-foreground whitespace-nowrap shadow-md">
          {label}
        </div>
      </div>
    </div>
  );
}

export interface RankingPlayer {
  tag: string;
  name: string;
  bayesianScore: number;
  averageStars: number;
  averageDestruction: number;
  warsParticipated: number;
  totalAttacks: number;
  perfectAttacks: number;
}

interface RankingListProps {
  data: RankingPlayer[];
  clanName: string;
  title: string;
  selectedMonthsLabel: string;
  renderExpanded: (player: RankingPlayer) => ReactNode;
}

const MEDAL = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#F59E0B", "#9CA3AF", "#B45309"];

function RankingImageTemplate({
  data,
  clanName,
  title,
  monthsLabel,
}: {
  data: RankingPlayer[];
  clanName: string;
  title: string;
  monthsLabel: string;
}) {
  return (
    <div
      style={{
        width: 560,
        background: "#09090b",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />

      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #1c1c1f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div
            style={{
              background: "#1a1a2e",
              border: "1px solid #6366f1",
              borderRadius: 6,
              padding: "2px 8px",
              color: "#818cf8",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ color: "#fafafa", fontSize: 18, fontWeight: 800, marginBottom: 2 }}>
          {clanName}
        </div>
        <div style={{ color: "#52525b", fontSize: 11 }}>{monthsLabel}</div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 24px",
          borderBottom: "1px solid #1c1c1f",
          color: "#3f3f46",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ width: 32 }}>#</span>
        <span style={{ flex: 1 }}>Jogador</span>
        <span style={{ width: 52, textAlign: "right" }}>Pontos</span>
        <span style={{ width: 52, textAlign: "right" }}>Média</span>
        <span style={{ width: 48, textAlign: "right" }}>Dest.</span>
        <span style={{ width: 44, textAlign: "right" }}>Guerras</span>
        <span style={{ width: 44, textAlign: "right" }}>ATQ</span>
        <span style={{ width: 36, textAlign: "right" }}>PT</span>
      </div>

      {/* Rows */}
      {data.map((p, i) => {
        const isTop3 = i < 3;
        return (
          <div
            key={p.tag}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "9px 24px",
              borderBottom: "1px solid #111113",
              background: isTop3 ? "rgba(99,102,241,0.05)" : i % 2 === 0 ? "#09090b" : "#0c0c0e",
            }}
          >
            <div style={{ width: 32, fontSize: isTop3 ? 15 : 12, color: isTop3 ? MEDAL_COLORS[i] : "#52525b", fontWeight: 700 }}>
              {isTop3 ? MEDAL[i] : `${i + 1}`}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fafafa", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </div>
              <div style={{ color: "#3f3f46", fontSize: 10, fontFamily: "monospace" }}>{p.tag}</div>
            </div>

            <div style={{ width: 52, textAlign: "right", color: "#e4e4e7", fontSize: 13, fontWeight: 700 }}>
              {p.bayesianScore.toFixed(2)}
            </div>
            <div style={{ width: 52, textAlign: "right", color: "#fbbf24", fontSize: 13, fontWeight: 600 }}>
              {p.averageStars.toFixed(2)}⭐
            </div>
            <div style={{ width: 48, textAlign: "right", color: "#fb923c", fontSize: 13 }}>
              {p.averageDestruction.toFixed(0)}%
            </div>
            <div style={{ width: 44, textAlign: "right", color: "#60a5fa", fontSize: 13 }}>
              {p.warsParticipated}
            </div>
            <div style={{ width: 44, textAlign: "right", color: "#4ade80", fontSize: 13 }}>
              {p.totalAttacks}
            </div>
            <div style={{ width: 36, textAlign: "right", color: "#a78bfa", fontSize: 13, fontWeight: 700 }}>
              {p.perfectAttacks}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div
        style={{
          padding: "8px 24px",
          borderTop: "1px solid #1c1c1f",
          color: "#27272a",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textAlign: "right",
        }}
      >
        CLASHDATA
      </div>
    </div>
  );
}

function RankRow({
  player,
  rank,
  renderExpanded,
}: {
  player: RankingPlayer;
  rank: number;
  renderExpanded: (p: RankingPlayer) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  const medal = MEDAL[rank - 1];
  const isTop3 = rank <= 3;

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        isTop3 ? "border-primary/20 bg-primary/3" : "border-border bg-card"
      )}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Rank */}
        <div className="w-8 shrink-0 text-center">
          {medal ? (
            <span className="text-lg leading-none">{medal}</span>
          ) : (
            <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
          )}
        </div>

        {/* Name + tag */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{player.name}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{player.tag}</p>
        </div>

        {/* Stats — visible sm+ */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          {[
            { icon: <Trophy className="h-3.5 w-3.5" />, value: player.bayesianScore.toFixed(2), label: "Pontos" },
            { icon: <Star className="h-3.5 w-3.5 text-yellow-500" />, value: player.averageStars.toFixed(2), label: "Média de estrelas" },
            { icon: <Flame className="h-3.5 w-3.5 text-orange-500" />, value: `${player.averageDestruction.toFixed(0)}%`, label: "Destruição média" },
            { icon: <Swords className="h-3.5 w-3.5 text-blue-500" />, value: player.warsParticipated, label: "Guerras participadas" },
            { icon: <Target className="h-3.5 w-3.5 text-green-500" />, value: player.totalAttacks, label: "Total de ataques" },
            { icon: <span className="text-sm leading-none">★</span>, value: player.perfectAttacks, label: "Ataques perfeitos (3★ 100%)" },
          ].map(({ icon, value, label }) => (
            <Tip key={label} label={label}>
              <div className="text-right">
                <div className="flex items-center justify-end text-muted-foreground mb-0.5">{icon}</div>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            </Tip>
          ))}
        </div>

        {/* Expand chevron */}
        <div className="shrink-0 ml-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Mobile stats grid */}
      <div className="sm:hidden px-4 pb-3 space-y-2">
        <div className="grid grid-cols-5 gap-1 text-center">
          {[
            { icon: <Trophy className="h-3 w-3 mx-auto" />, value: player.bayesianScore.toFixed(2), label: "Pontos" },
            { icon: <Star className="h-3 w-3 mx-auto text-yellow-500" />, value: player.averageStars.toFixed(2), label: "Média de estrelas" },
            { icon: <Swords className="h-3 w-3 mx-auto text-blue-500" />, value: player.warsParticipated, label: "Guerras participadas" },
            { icon: <Target className="h-3 w-3 mx-auto text-green-500" />, value: player.totalAttacks, label: "Total de ataques" },
            { icon: <span className="text-xs leading-none mx-auto block">★</span>, value: player.perfectAttacks, label: "Ataques perfeitos" },
          ].map(({ icon, value, label }) => (
            <Tip key={label} label={label} className="rounded-lg bg-muted/40 px-1 py-1.5">
              <div className="text-muted-foreground mb-0.5">{icon}</div>
              <p className="text-xs font-semibold leading-tight">{value}</p>
            </Tip>
          ))}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t bg-muted/20">
          {renderExpanded(player)}
        </div>
      )}
    </div>
  );
}

export function RankingList({
  data,
  clanName,
  title,
  selectedMonthsLabel,
  renderExpanded,
}: RankingListProps) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? data.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.tag.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const handleCopy = async () => {
    if (!imageRef.current) return;
    const dataUrl = await toPng(imageRef.current, { cacheBust: true, pixelRatio: 2 });
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const filename = `${title}.png`;

    // Android / iOS: Web Share API (share sheet nativa)
    if (typeof navigator.canShare === "function") {
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }
    }

    // Desktop: tenta copiar para clipboard
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return;
    } catch {
      // clipboard não disponível, vai para download
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Off-screen image template */}
      <div style={{ position: "absolute", left: -9999, top: -9999, pointerEvents: "none" }}>
        <div ref={imageRef}>
          <RankingImageTemplate
            data={data.slice(0, 10)}
            clanName={clanName}
            title={title}
            monthsLabel={selectedMonthsLabel}
          />
        </div>
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 gap-1.5 h-9"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="hidden sm:inline text-xs">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Copiar ranking</span>
            </>
          )}
        </Button>
      </div>

      {/* Count */}
      {search && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {data.length} jogadores
        </p>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Nenhum jogador encontrado
          </div>
        ) : (
          filtered.map((player, i) => {
            // preserve original rank even when filtered
            const originalRank = data.findIndex((p) => p.tag === player.tag) + 1;
            return (
              <RankRow
                key={player.tag}
                player={player}
                rank={originalRank}
                renderExpanded={renderExpanded}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
