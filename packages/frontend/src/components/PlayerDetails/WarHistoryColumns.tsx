import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { PlayerWarHistory } from "@/lib/api";

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  
  try {
    let date: Date;
    const compactMatch = dateString.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.(\d{1,3}))?Z?$/);
    
    if (compactMatch) {
      const [, year, month, day, hour, minute, second, millisecond] = compactMatch;
      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${millisecond ? `.${millisecond.padEnd(3, '0')}` : '.000'}Z`;
      date = new Date(isoString);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch (e) {
    return "N/A";
  }
};

export const columns: ColumnDef<PlayerWarHistory>[] = [
  {
    accessorKey: "warEndTime",
    header: "Data",
    cell: ({ row }) => formatDate(row.original.warEndTime),
  },
  {
    id: "war",
    header: "Guerra",
    cell: ({ row }) => {
      const war = row.original;
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{war.clanName || war.clanTag}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="font-medium">{war.opponentName || war.opponentTag}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "stars",
    header: "Estrelas",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-semibold">
        {row.original.stars} ⭐
      </Badge>
    ),
  },
  {
    accessorKey: "destructionPercentage",
    header: "Destruição",
    cell: ({ row }) => `${row.original.destructionPercentage.toFixed(1)}%`,
  },
  {
    accessorKey: "result",
    header: "Resultado",
    cell: ({ row }) => {
      const result = row.original.result;
      return (
        <Badge
          variant={result === "win" ? "default" : result === "loss" ? "destructive" : "secondary"}
          className={result === "win" ? "bg-green-500" : ""}
        >
          {result === "win" ? "Vitória" : result === "loss" ? "Derrota" : "Empate"}
        </Badge>
      );
    },
  },
];
