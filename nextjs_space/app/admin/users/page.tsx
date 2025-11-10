"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserTable } from "@/components/admin/user-table";
import { EditUserModal } from "@/components/admin/edit-user-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ArrowLeft } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    conversations: number;
  };
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/chat");
      return;
    }

    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status, session, router]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950 p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/dashboard")}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        <Card className="bg-slate-900/50 border-blue-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Gestão de Usuários</CardTitle>
            <CardDescription className="text-slate-400">
              Gerencie todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Filtrar por função" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="GUEST">GUEST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <UserTable
              users={filteredUsers}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                Nenhum usuário encontrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <EditUserModal
          user={selectedUser}
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={fetchUsers}
        />
      </div>
    </div>
  );
}
