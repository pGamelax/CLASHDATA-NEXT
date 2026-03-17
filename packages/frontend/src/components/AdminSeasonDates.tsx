"use client";

import { useState } from "react";
import {
  createSeasonEndDate,
  deleteSeasonEndDate,
  triggerSeasonSnapshot,
  type SeasonEndDate,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  Trash2,
  Play,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSeasonDatesProps {
  initialDates: SeasonEndDate[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  PENDING: { label: "Agendado", icon: Clock, className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  RUNNING: { label: "Executando", icon: Loader2, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  COMPLETED: { label: "Concluído", icon: CheckCircle2, className: "bg-green-500/10 text-green-500 border-green-500/20" },
  FAILED: { label: "Falhou", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

function formatDateBR(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminSeasonDates({ initialDates }: AdminSeasonDatesProps) {
  const [dates, setDates] = useState<SeasonEndDate[]>(initialDates);
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!date) return;
    setIsCreating(true);
    setError(null);
    try {
      const created = await createSeasonEndDate(date, label || undefined);
      setDates((prev) => [created, ...prev]);
      setDate("");
      setLabel("");
    } catch (err: any) {
      setError(err.message || "Erro ao criar temporada");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSeasonEndDate(id);
      setDates((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setError(err.message || "Erro ao remover temporada");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTrigger = async (id: string) => {
    setTriggeringId(id);
    try {
      await triggerSeasonSnapshot(id);
      setDates((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "RUNNING" } : d))
      );
    } catch (err: any) {
      setError(err.message || "Erro ao executar captura");
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Temporadas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Defina o dia final de cada temporada. Às 02:00 AM (horário de SP), o sistema capturará
          automaticamente a classificação de todos os clãs.
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova temporada
          </CardTitle>
          <CardDescription>
            O job será agendado para rodar às 02:00 AM (SP) da data selecionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Data final da temporada *
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Rótulo (opcional)
              </label>
              <Input
                placeholder="Ex: Março 2026"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}

          <Button onClick={handleCreate} disabled={!date || isCreating} size="sm">
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CalendarClock className="h-4 w-4 mr-2" />
            )}
            Agendar temporada
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Temporadas agendadas ({dates.length})
        </h2>

        {dates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma temporada agendada ainda.
            </CardContent>
          </Card>
        ) : (
          dates.map((d) => {
            const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.PENDING;
            const Icon = cfg.icon;
            const isRunning = d.status === "RUNNING";

            return (
              <Card key={d.id}>
                <CardContent className="py-4 px-5 flex items-center gap-4">
                  {/* Date + label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {d.label || formatDateBR(d.date)}
                      </span>
                      {d.label && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDateBR(d.date)}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", cfg.className)}
                      >
                        <Icon className={cn("h-3 w-3 mr-1", isRunning && "animate-spin")} />
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span>⏰ Job: 02:00 AM SP ({formatDateBR(d.date)})</span>
                      {d.capturedAt && (
                        <span>✅ Capturado: {formatDateTime(d.capturedAt)}</span>
                      )}
                      {d._count && (
                        <span>📊 {d._count.snapshots} clã{d._count.snapshots !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      disabled={isRunning || triggeringId === d.id}
                      onClick={() => handleTrigger(d.id)}
                      title="Executar agora (manual)"
                    >
                      {triggeringId === d.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">Executar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === d.id}
                      onClick={() => handleDelete(d.id)}
                    >
                      {deletingId === d.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
