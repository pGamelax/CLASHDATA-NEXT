"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function AdminClansPage() {
  const router = useRouter();
  const [clans, setClans] = useState<any[]>([]);
  const [filteredClans, setFilteredClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClans();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clans.filter(
        (clan) =>
          clan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clan.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clan.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClans(filtered);
    } else {
      setFilteredClans(clans);
    }
  }, [searchTerm, clans]);

  const fetchClans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/clans`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setClans(data.data || []);
        setFilteredClans(data.data || []);
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

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, tag ou organização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredClans.length} de {clans.length} clans
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Clans ({filteredClans.length})
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
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum clan encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClans.map((clan) => (
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
                    <TableCell>
                      {/* Botão de deletar removido para evitar criação de múltiplas contas para ganhar trials */}
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
