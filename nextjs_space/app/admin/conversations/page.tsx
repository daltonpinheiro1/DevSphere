
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, Edit, Trash2, Shield, Users, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  companyId?: string;
  createdAt: string;
  creator?: {
    name: string;
    email: string;
  };
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ASSISTANT',
    companyId: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar usuário');
      }

      toast.success('Usuário criado com sucesso!');
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'ASSISTANT',
        companyId: '',
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          companyId: formData.companyId,
        }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar usuário');

      toast.success('Usuário atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao desativar usuário');

      toast.success('Usuário desativado com sucesso!');
      fetchUsers();
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast.error('Erro ao desativar usuário');
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      companyId: user.companyId || '',
    });
    setEditDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      ADMIN: { label: 'Administrador', className: 'bg-red-500 hover:bg-red-600' },
      MANAGER: { label: 'Gerente', className: 'bg-blue-500 hover:bg-blue-600' },
      ASSISTANT: { label: 'Auxiliar', className: 'bg-green-500 hover:bg-green-600' },
      USER: { label: 'Usuário', className: 'bg-gray-500 hover:bg-gray-600' },
    };

    const config = roleConfig[role] || { label: role, className: 'bg-gray-500' };
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'MANAGER':
        return <Users className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  // Estatísticas
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    managers: users.filter((u) => u.role === 'MANAGER').length,
    assistants: users.filter((u) => u.role === 'ASSISTANT').length,
    active: users.filter((u) => u.isActive).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Gerenciamento de Usuários
            </h1>
            <p className="text-gray-300">
              Controle de acessos e permissões hierárquicas
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white border-slate-700">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Preencha os dados do novo usuário
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Nível de Acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="MANAGER">Gerente</SelectItem>
                      <SelectItem value="ASSISTANT">Auxiliar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="companyId">ID da Empresa (opcional)</Label>
                  <Input
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) =>
                      setFormData({ ...formData, companyId: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Criar Usuário
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Administradores</p>
                <p className="text-2xl font-bold text-white">{stats.admins}</p>
              </div>
              <Shield className="w-8 h-8 text-red-400" />
            </div>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Gerentes</p>
                <p className="text-2xl font-bold text-white">{stats.managers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Auxiliares</p>
                <p className="text-2xl font-bold text-white">{stats.assistants}</p>
              </div>
              <UserIcon className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ativos</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
          </Card>
        </div>

        {/* Lista de Usuários */}
        {loading ? (
          <div className="text-center text-white py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Carregando usuários...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card
                key={user.id}
                className="bg-slate-800/50 border-slate-700 p-6 hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {user.name}
                        </h3>
                        {getRoleBadge(user.role)}
                        {!user.isActive && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      {user.creator && (
                        <p className="text-gray-500 text-xs mt-1">
                          Criado por: {user.creator.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="border-slate-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription className="text-gray-400">
              Atualize os dados do usuário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Nível de Acesso</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="MANAGER">Gerente</SelectItem>
                  <SelectItem value="ASSISTANT">Auxiliar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
            >
              Atualizar Usuário
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
