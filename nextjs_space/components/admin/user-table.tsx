"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

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

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: "bg-red-500/20 text-red-300 border-red-500/50",
      USER: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      GUEST: "bg-gray-500/20 text-gray-300 border-gray-500/50",
    };
    return colors[role as keyof typeof colors] || colors.USER;
  };

  return (
    <div className="rounded-md border border-blue-500/20 bg-slate-900/50">
      <Table>
        <TableHeader>
          <TableRow className="border-blue-500/20 hover:bg-slate-800/50">
            <TableHead className="text-slate-300">Usuário</TableHead>
            <TableHead className="text-slate-300">Email</TableHead>
            <TableHead className="text-slate-300">Função</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Conversas</TableHead>
            <TableHead className="text-slate-300">Cadastro</TableHead>
            <TableHead className="text-slate-300 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-blue-500/20 hover:bg-slate-800/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white font-medium">{user.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-300">{user.email}</TableCell>
              <TableCell>
                <Badge className={getRoleBadge(user.role)}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Ativo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">Inativo</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-slate-300">
                {user._count?.conversations || 0}
              </TableCell>
              <TableCell className="text-slate-300">
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(user.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
