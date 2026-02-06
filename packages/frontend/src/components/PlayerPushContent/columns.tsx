"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trophy, Swords, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { PlayerPushStats } from "@/lib/api";

interface PlayerPushStatsWithRank extends PlayerPushStats {
  rank?: number;
}

export const columns: ColumnDef<PlayerPushStatsWithRank>[] = [
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
    accessorKey: "currentTrophies",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="TROFÉUS" />
    ),
    cell: ({ row }) => {
      const trophies = row.getValue("currentTrophies") as number;
      return (
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold">{trophies.toLocaleString("pt-BR")}</span>
        </div>
      );
    },
  },
  {
    id: "attacks",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ATAQUES (+)" />
    ),
    cell: ({ row }) => {
      const player = row.original;
      return (
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-green-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-green-500">+{player.totalAttack}</span>
            <span className="text-xs text-muted-foreground">{player.attackCount} ataque{player.attackCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      return rowA.original.totalAttack - rowB.original.totalAttack;
    },
  },
  {
    id: "defenses",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="DEFESAS (-)" />
    ),
    cell: ({ row }) => {
      const player = row.original;
      return (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-red-500">-{player.totalDefense}</span>
            <span className="text-xs text-muted-foreground">{player.defenseCount} defesa{player.defenseCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      return rowA.original.totalDefense - rowB.original.totalDefense;
    },
  },
];
