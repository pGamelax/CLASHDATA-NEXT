"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown } from "lucide-react"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"

export type Member = {
  tag: string
  name: string
  role: string
  townHallLevel: number
  expLevel: number
  trophies: number
  clanRank: number
  donations: number
  donationsReceived: number
}

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "clanRank",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rank" />
    ),
    cell: ({ row }) => {
      const rank = row.getValue("clanRank") as number
      return (
        <div className="flex items-center gap-2">
          {rank <= 3 && (
            <Crown
              className={`h-4 w-4 ${
                rank === 1
                  ? "text-yellow-500"
                  : rank === 2
                    ? "text-gray-400"
                    : "text-orange-500"
              }`}
            />
          )}
          <span className="font-semibold text-foreground">#{rank}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>
    },
  },
  {
    accessorKey: "tag",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tag" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-sm font-mono">{row.getValue("tag")}</div>
      )
    },
  },
  {
    accessorKey: "townHallLevel",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="TH" />
    ),
    cell: ({ row }) => {
      return (
        <Badge variant="secondary" className="text-xs">
          TH{row.getValue("townHallLevel")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "trophies",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Troféus" />
    ),
    cell: ({ row }) => {
      const trophies = row.getValue("trophies") as number
      return (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold">{trophies.toLocaleString()}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "donations",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Doações" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("donations")}</div>
    },
  },
  {
    accessorKey: "donationsReceived",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recebidas" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("donationsReceived")}</div>
    },
  },
  {
    accessorKey: "role",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cargo" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const roleLabels: Record<string, string> = {
        leader: "Líder",
        coLeader: "Co-líder",
        admin: "Elder",
        member: "Membro",
      }
      const roleColors: Record<string, string> = {
        leader: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        coLeader: "bg-primary/10 text-primary border-primary/20",
        admin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        member: "",
      }
      return (
        <Badge variant="outline" className={roleColors[role] || ""}>
          {roleLabels[role] || role}
        </Badge>
      )
    },
  },
]

