'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Brain, FileText, Upload, X, Download } from 'lucide-react';

interface Chatbot {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  training_files?: TrainingFile[];
  whatsapp_instances?: any[];
}

interface TrainingFile {
  id: string;
  chatbot_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_at: Date;
}

export function ChatbotsManager() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/chatbots');
      const data = await res.json();
      setChatbots(data.chatbots || []);
    } catch (error) {
      toast.error('Erro ao carregar chatbots');
    } finally {
      setLoading(false);
    }
  };

  const createChatbot = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      toast.error('Preencha nome e prompt do sistema');
      return;
    }

    try {
      const res = await fetch('/api/whatsapp/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          system_prompt: systemPrompt,
          is_active: isActive,
        }),
      });

      if (!res.ok) throw new Error('Erro ao criar chatbot');

      toast.success('Chatbot criado com sucesso!');
      setCreateDialogOpen(false);
      resetForm();
      fetchChatbots();
    } catch (error) {
      toast.error('Erro ao criar chatbot');
    }
  };

  const updateChatbot = async () => {
    if (!selectedChatbot) return;

    try {
      const res = await fetch(`/api/whatsapp/chatbots/${selectedChatbot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          system_prompt: systemPrompt,
          is_active: isActive,
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar chatbot');

      toast.success('Chatbot atualizado!');
      setEditDialogOpen(false);
      fetchChatbots();
    } catch (error) {
      toast.error('Erro ao atualizar chatbot');
    }
  };

  const deleteChatbot = async () => {
    if (!selectedChatbot) return;

    try {
      const res = await fetch(`/api/whatsapp/chatbots/${selectedChatbot.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao deletar chatbot');

      toast.success('Chatbot deletado');
      setDeleteDialogOpen(false);
      setSelectedChatbot(null);
      fetchChatbots();
    } catch (error) {
      toast.error('Erro ao deletar chatbot');
    }
  };

  const uploadTrainingFile = async (file: File) => {
    if (!selectedChatbot) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/whatsapp/chatbots/${selectedChatbot.id}/training-files`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      toast.success(`Arquivo ${file.name} enviado com sucesso!`);
      // Recarregar chatbot para atualizar lista de arquivos
      const chatbotRes = await fetch(`/api/whatsapp/chatbots/${selectedChatbot.id}`);
      const chatbotData = await chatbotRes.json();
      setSelectedChatbot(chatbotData);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const deleteTrainingFile = async (fileId: string) => {
    if (!selectedChatbot) return;

    try {
      const res = await fetch(`/api/whatsapp/chatbots/${selectedChatbot.id}/training-files/${fileId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao deletar arquivo');

      toast.success('Arquivo removido');
      // Recarregar chatbot
      const chatbotRes = await fetch(`/api/whatsapp/chatbots/${selectedChatbot.id}`);
      const chatbotData = await chatbotRes.json();
      setSelectedChatbot(chatbotData);
    } catch (error) {
      toast.error('Erro ao deletar arquivo');
    }
  };

  const openEditDialog = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setName(chatbot.name);
    setDescription(chatbot.description || '');
    setSystemPrompt(chatbot.system_prompt);
    setIsActive(chatbot.is_active);
    setEditDialogOpen(true);
  };

  const openFilesDialog = async (chatbot: Chatbot) => {
    // Buscar chatbot completo com arquivos
    const res = await fetch(`/api/whatsapp/chatbots/${chatbot.id}`);
    const data = await res.json();
    setSelectedChatbot(data);
    setFilesDialogOpen(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSystemPrompt('');
    setIsActive(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-500" />
                Chatbots & IA
              </CardTitle>
              <CardDescription>
                Gerencie chatbots personalizados e arquivos de treinamento
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Chatbot
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Chatbot</DialogTitle>
                  <DialogDescription>
                    Configure um novo chatbot com IA personalizada
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Chatbot*</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Assistente de Vendas TIM"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Breve descrição do chatbot"
                    />
                  </div>
                  <div>
                    <Label htmlFor="systemPrompt">Prompt do Sistema (Instruções da IA)*</Label>
                    <Textarea
                      id="systemPrompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Ex: Você é um assistente de vendas especializado em planos TIM..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Este prompt define como a IA se comportará e responderá
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="isActive">Chatbot ativo</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createChatbot} className="flex-1">
                      Criar Chatbot
                    </Button>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {chatbots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum chatbot criado ainda</p>
              <p className="text-sm">Clique em "Criar Chatbot" para começar</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {chatbots.map((chatbot) => (
                <Card key={chatbot.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-500" />
                          {chatbot.name}
                          {chatbot.is_active ? (
                            <Badge variant="default" className="bg-green-500">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </CardTitle>
                        {chatbot.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {chatbot.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Arquivos de Treinamento</p>
                        <p className="font-semibold">{chatbot.training_files?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Instâncias</p>
                        <p className="font-semibold">{chatbot.whatsapp_instances?.length || 0}</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded text-xs font-mono max-h-20 overflow-y-auto">
                      {chatbot.system_prompt.substring(0, 150)}...
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openFilesDialog(chatbot)}
                        className="flex-1"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Arquivos ({chatbot.training_files?.length || 0})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(chatbot)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedChatbot(chatbot);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Chatbot</DialogTitle>
            <DialogDescription>
              Atualize as configurações do chatbot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Nome do Chatbot*</Label>
              <Input
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Descrição (opcional)</Label>
              <Input
                id="editDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editSystemPrompt">Prompt do Sistema*</Label>
              <Textarea
                id="editSystemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editIsActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="editIsActive">Chatbot ativo</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={updateChatbot} className="flex-1">
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Arquivos de Treinamento */}
      <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Arquivos de Treinamento - {selectedChatbot?.name}
            </DialogTitle>
            <DialogDescription>
              Faça upload de arquivos (TXT, PDF, JSON, CSV, DOCX) para treinar o chatbot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Upload */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="fileUpload"
                accept=".txt,.pdf,.json,.csv,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadTrainingFile(file);
                  e.target.value = '';
                }}
                className="hidden"
                disabled={uploading}
              />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">
                  {uploading ? 'Fazendo upload...' : 'Clique para selecionar arquivo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  TXT, PDF, JSON, CSV ou DOCX (máx. 10MB)
                </p>
              </label>
            </div>

            {/* Lista de Arquivos */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Arquivos Enviados ({selectedChatbot?.training_files?.length || 0})</h4>
              {(!selectedChatbot?.training_files || selectedChatbot.training_files.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum arquivo enviado ainda
                </p>
              ) : (
                selectedChatbot.training_files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTrainingFile(file.id)}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Deletar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Chatbot?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O chatbot "{selectedChatbot?.name}" e todos os seus arquivos de treinamento serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteChatbot} className="bg-red-600 hover:bg-red-700">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
