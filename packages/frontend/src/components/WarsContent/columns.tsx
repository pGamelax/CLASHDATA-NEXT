"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trophy, Star, Swords, ChevronDown, ChevronRight } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PlayerStats } from "@/lib/api";

interface PlayerStatsWithRank extends PlayerStats {
  rank?: number;
}

export const columns: ColumnDef<PlayerStatsWithRank>[] = [
  {
    id: "rank",
    header: "#",
    cell: ({ row, table }) => {
      const rank = row.index + 1;
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      const actualRank = pageIndex * pageSize + rank;
      
      if (actualRank === 1) {
        return (
          <div className="flex items-center justify-center w-8 h-8">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
        );
      } else if (actualRank === 2) {
        return (
          <div className="flex items-center justify-center w-8 h-8">
            <Trophy className="h-5 w-5 text-gray-400" />
          </div>
        );
      } else if (actualRank === 3) {
        return (
          <div className="flex items-center justify-center w-8 h-8">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center w-8 h-8 text-muted-foreground font-semibold">
          {actualRank}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="JOGADOR" />
    ),
    cell: ({ row }) => {
      const player = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <div className="flex flex-col">
            <div className="font-medium">{player.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{player.tag}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "bayesianScore",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="EFICIÊNCIA" />
    ),
    cell: ({ row }) => {
      const score = row.getValue("bayesianScore") as number;
      const player = row.original;
      const perfectAttacks = player.perfectAttacks || 0;
      // Calcula porcentagem baseada no máximo de 3.0
      const percentage = (score / 3.0) * 100;
      
      return (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-bold text-sm">{score.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">pts</span>
            <span className="text-xs font-semibold text-muted-foreground">
              {perfectAttacks} PT
            </span>
          </div>
          <Progress value={percentage} className="h-1 w-[80px] bg-primary/20 [&>div]:bg-primary" />
        </div>
      );
    },
  },
  {
    id: "attackAverage",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="MÉDIA ATAQUE" />
    ),
    cell: ({ row }) => {
      const player = row.original;
      const avgStars = player.averageStars;
      const avgDestruction = player.averageDestruction;
      
      return (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <div className="flex flex-col">
            <span className="font-semibold">{avgStars.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">{avgDestruction.toFixed(0)}% destruição</span>
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const avgA = rowA.original.averageStars;
      const avgB = rowB.original.averageStars;
      return avgA - avgB;
    },
  },
  {
    id: "participation",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PARTICIPAÇÃO" />
    ),
    cell: ({ row }) => {
      const player = row.original;
      const wars = player.warsParticipated;
      const attacks = player.totalAttacks;
      const maxAttacks = wars * 2; // Máximo de 2 ataques por guerra
      const attackRatio = `${attacks}/${maxAttacks}`;
      
      return (
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-green-500" />
          <div className="flex flex-col">
            <span className="font-semibold">{wars} Guerras</span>
            <span className="text-xs text-muted-foreground">{attackRatio} ATQ</span>
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const warsA = rowA.original.warsParticipated;
      const warsB = rowB.original.warsParticipated;
      return warsA - warsB;
    },
  },
];
