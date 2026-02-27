"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export function AdminClansPage() {
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchClans();
  }, []);

  const fetchClans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/admin/clans`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setClans(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar clans:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Todos os Clans</h1>
        <p className="text-muted-foreground">
          Lista de todos os clans cadastrados no sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Clans ({clans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum clan encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clans.map((clan) => (
                  <TableRow key={clan.id}>
                    <TableCell className="font-medium">{clan.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{clan.tag}</Badge>
                    </TableCell>
                    <TableCell>{clan.organization?.name || "N/A"}</TableCell>
                    <TableCell>{clan.clanLevel || "N/A"}</TableCell>
                    <TableCell>{clan.members || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(clan.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
