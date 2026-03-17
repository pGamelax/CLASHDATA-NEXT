"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users, Search, Edit, Trash2, Loader2, RefreshCw,
  AlertCircle, Ban, CheckCircle2, Building2, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className="hidden sm:block h-5 w-12 rounded-full" />
      <Skeleton className="hidden md:block h-5 w-14 rounded-full" />
      <Skeleton className="hidden lg:block h-3 w-20" />
      <div className="flex gap-1.5 shrink-0">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user", banned: false });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/admin/users`, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const data = await res.json();
      setUsers(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_URL}/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao salvar");
      }
      await fetchUsers();
      setEditUser(null);
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleting(userId);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao excluir");
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-muted-foreground" />
            Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando..." : `${users.length} usuário${users.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => fetchUsers(true)} disabled={refreshing || loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Errors */}
      {(error || actionError) && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error || actionError}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {!loading && (
          <span className="text-sm text-muted-foreground shrink-0">{filtered.length} de {users.length}</span>
        )}
      </div>

      {/* List */}
      <Card>
        {loading ? (
          <div>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-sm">{search ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {filtered.map((user) => {
              const ini = initials(user.name);
              const isAdmin = user.role === "admin";
              const orgsCount = user._count?.members ?? 0;

              return (
                <div key={user.id} className={cn(
                  "flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors",
                  user.banned && "opacity-60"
                )}>
                  {/* Avatar */}
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shrink-0 select-none",
                    isAdmin ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {ini}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate">{user.name || "—"}</p>
                      {isAdmin && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/30 border">
                          <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />admin
                        </Badge>
                      )}
                      {user.banned && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                          <Ban className="h-2.5 w-2.5" />Banido
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>

                  {/* Status */}
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    {user.banned ? (
                      <Ban className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    )}
                  </div>

                  {/* Orgs */}
                  <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <Building2 className="h-3.5 w-3.5" />
                    {orgsCount} org{orgsCount !== 1 ? "s" : ""}
                  </div>

                  {/* Date */}
                  <span className="hidden lg:block text-[11px] text-muted-foreground shrink-0">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit */}
                    <Dialog open={editUser?.id === user.id} onOpenChange={(v) => { if (!v) { setEditUser(null); setEditError(null); } }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditUser(user); setEditForm({ name: user.name || "", email: user.email || "", role: user.role || "user", banned: user.banned || false }); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Usuário</DialogTitle>
                          <DialogDescription>Editando <strong>{user.name || user.email}</strong></DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                          {editError && (
                            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{editError}
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Label>Nome</Label>
                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Email</Label>
                            <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Role</Label>
                            <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5">
                            <Checkbox id="banned" checked={editForm.banned}
                              onCheckedChange={(v) => setEditForm({ ...editForm, banned: !!v })} />
                            <Label htmlFor="banned" className="cursor-pointer text-sm font-medium leading-none">
                              Usuário banido
                            </Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => { setEditUser(null); setEditError(null); }}>Cancelar</Button>
                          <Button onClick={handleSave} disabled={saving}>
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Salvar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={deleting === user.id}>
                          {deleting === user.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                          <AlertDialogDescription>
                            Excluir <strong>{user.name || user.email}</strong>? Todos os dados serão removidos. Ação irreversível.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
