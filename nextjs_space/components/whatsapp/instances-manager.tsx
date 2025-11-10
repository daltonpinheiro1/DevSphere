
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Power, PowerOff, Trash2, QrCode, Settings, Pause, Play, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface WhatsAppInstance {
  id: string;
  name: string;
  companyName?: string;
  phoneNumber?: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'paused' | 'error';
  qrCode?: string;
  lastConnected?: Date;
  messagesPerBatch: number;
  proxyUrl?: string;
  autoReply: boolean;
  isActive: boolean;
  totalMessagesSent: number;
  currentMessageCount: number;
}

export function InstancesManager() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [currentQr, setCurrentQr] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [messagesPerBatch, setMessagesPerBatch] = useState(20);
  const [proxyUrl, setProxyUrl] = useState('');

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const res = await fetch('/api/whatsapp/instances');
      const data = await res.json();
      setInstances(data.instances || []);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast.error('Erro ao carregar instâncias');
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    if (!name.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }

    try {
      const res = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          companyName: companyName || undefined,
          messagesPerBatch,
          proxyUrl: proxyUrl || undefined,
        }),
      });

      if (!res.ok) throw new Error('Erro ao criar instância');

      toast.success('Instância criada com sucesso!');
      setCreateDialogOpen(false);
      resetForm();
      fetchInstances();
    } catch (error) {
      toast.error('Erro ao criar instância');
    }
  };

  const connectInstance = async (id: string) => {
    try {
      const res = await fetch(`/api/whatsapp/instances/${id}/connect`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Erro ao conectar');

      toast.success('Conectando... Aguarde o QR Code');
      setQrDialogOpen(true);

      // Poll para atualizar QR code e status
      let hasShownQrToast = false;
      const interval = setInterval(async () => {
        const statusRes = await fetch(`/api/whatsapp/instances/${id}`);
        const statusData = await statusRes.json();
        const instance = statusData.instance;
        
        if (!instance) return;
        
        // Atualizar QR code se disponível ou mudou
        if (instance.qrCode && instance.qrCode !== currentQr) {
          setCurrentQr(instance.qrCode);
          if (!hasShownQrToast) {
            toast.success('QR Code gerado! Escaneie para conectar');
            hasShownQrToast = true;
          }
        }
        
        // Verificar se conectou
        if (instance.status === 'connected') {
          clearInterval(interval);
          setQrDialogOpen(false);
          setCurrentQr('');
          toast.success('WhatsApp conectado com sucesso!');
          fetchInstances();
        }
      }, 2000);

      // Limpar após 2 minutos
      setTimeout(() => {
        clearInterval(interval);
        if (currentQr) {
          setQrDialogOpen(false);
          setCurrentQr('');
          toast.error('Tempo limite excedido. Tente novamente.');
        }
      }, 120000);
    } catch (error) {
      toast.error('Erro ao conectar instância');
      setQrDialogOpen(false);
    }
  };

  const disconnectInstance = async (id: string) => {
    try {
      const res = await fetch(`/api/whatsapp/instances/${id}/disconnect`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Erro ao desconectar');

      toast.success('Instância desconectada');
      fetchInstances();
    } catch (error) {
      toast.error('Erro ao desconectar instância');
    }
  };

  const togglePause = async (instance: WhatsAppInstance) => {
    try {
      const newStatus = instance.status === 'paused' ? 'connected' : 'paused';
      
      const res = await fetch(`/api/whatsapp/instances/${instance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar status');

      toast.success(newStatus === 'paused' ? 'Instância pausada' : 'Instância retomada');
      fetchInstances();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const toggleAutoReply = async (instance: WhatsAppInstance) => {
    try {
      const res = await fetch(`/api/whatsapp/instances/${instance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoReply: !instance.autoReply }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar auto-resposta');

      toast.success(instance.autoReply ? 'Auto-resposta desativada' : 'Auto-resposta ativada');
      fetchInstances();
    } catch (error) {
      toast.error('Erro ao atualizar auto-resposta');
    }
  };

  const toggleIsActive = async (instance: WhatsAppInstance) => {
    try {
      const res = await fetch(`/api/whatsapp/instances/${instance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !instance.isActive }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar status ativo');

      toast.success(instance.isActive ? 'Chat desativado' : 'Chat ativado');
      fetchInstances();
    } catch (error) {
      toast.error('Erro ao atualizar status ativo');
    }
  };

  const updateInstanceConfig = async () => {
    if (!selectedInstance) return;

    try {
      const res = await fetch(`/api/whatsapp/instances/${selectedInstance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          companyName: companyName || undefined,
          messagesPerBatch,
          proxyUrl: proxyUrl || undefined,
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar configuração');

      toast.success('Configuração atualizada!');
      setConfigDialogOpen(false);
      fetchInstances();
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  const deleteInstance = async () => {
    if (!selectedInstance) return;

    try {
      const res = await fetch(`/api/whatsapp/instances/${selectedInstance.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao deletar instância');

      toast.success('Instância deletada');
      setDeleteDialogOpen(false);
      fetchInstances();
    } catch (error) {
      toast.error('Erro ao deletar instância');
    }
  };

  const openConfigDialog = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setName(instance.name);
    setCompanyName(instance.companyName || '');
    setMessagesPerBatch(instance.messagesPerBatch);
    setProxyUrl(instance.proxyUrl || '');
    setConfigDialogOpen(true);
  };

  const openDeleteDialog = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setName('');
    setCompanyName('');
    setMessagesPerBatch(20);
    setProxyUrl('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      connected: { variant: 'default', label: '✅ Conectado' },
      connecting: { variant: 'secondary', label: '🔄 Conectando' },
      disconnected: { variant: 'destructive', label: '❌ Desconectado' },
      paused: { variant: 'outline', label: '⏸️ Pausado' },
      error: { variant: 'destructive', label: '⚠️ Erro' },
    };

    const config = variants[status] || variants.disconnected;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image 
                src="/logo-devsphere.png" 
                alt="DevSphere.ai - Logo" 
                width={48} 
                height={48}
                className="rounded-lg"
              />
              <div>
                <CardTitle className="text-2xl">Gerenciamento de Números WhatsApp</CardTitle>
                <CardDescription>Conecte e gerencie múltiplos números sem limites</CardDescription>
              </div>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Número
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Conectar Novo Número WhatsApp</DialogTitle>
                  <DialogDescription>Crie uma nova instância para conectar um número via QR Code</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Instância *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Atendimento Principal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Nome da Empresa (Opcional)</Label>
                    <Input
                      id="companyName"
                      placeholder="Ex: Sua Empresa"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="messagesPerBatch">Mensagens por Lote (Rate Limiting)</Label>
                    <Input
                      id="messagesPerBatch"
                      type="number"
                      placeholder="20"
                      value={messagesPerBatch}
                      onChange={(e) => setMessagesPerBatch(parseInt(e.target.value) || 20)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Define quantas mensagens enviar antes de fazer uma pausa
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="proxyUrl">Proxy URL (Opcional)</Label>
                    <Input
                      id="proxyUrl"
                      placeholder="http://proxy:port"
                      value={proxyUrl}
                      onChange={(e) => setProxyUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use proxy para rotação de IP dinâmica
                    </p>
                  </div>
                  <Button onClick={createInstance} className="w-full">
                    Criar e Conectar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {instances.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                Nenhum número conectado. Clique em "Novo Número" para começar!
              </div>
            ) : (
              instances.map((instance) => (
                <Card key={instance.id} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {instance.name}
                          {getStatusBadge(instance.status)}
                        </CardTitle>
                        <div className="space-y-1 mt-2">
                          {instance.phoneNumber && (
                            <p className="text-sm text-blue-600 font-semibold">
                              📱 {instance.phoneNumber}
                            </p>
                          )}
                          {instance.companyName && (
                            <p className="text-sm text-muted-foreground">
                              🏢 {instance.companyName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            📊 Total enviado: <strong>{instance.totalMessagesSent}</strong> msgs
                          </p>
                          <p className="text-xs text-muted-foreground">
                            🔢 Lote atual: {instance.currentMessageCount}/{instance.messagesPerBatch}
                          </p>
                          {instance.lastConnected && (
                            <p className="text-xs text-muted-foreground">
                              🕐 Última conexão: {new Date(instance.lastConnected).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Toggles */}
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <Label htmlFor={`autoReply-${instance.id}`} className="text-sm cursor-pointer">
                        🤖 Resposta Automática (IA)
                      </Label>
                      <Switch
                        id={`autoReply-${instance.id}`}
                        checked={instance.autoReply}
                        onCheckedChange={() => toggleAutoReply(instance)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <Label htmlFor={`isActive-${instance.id}`} className="text-sm cursor-pointer">
                        💬 Chat Ativo
                      </Label>
                      <Switch
                        id={`isActive-${instance.id}`}
                        checked={instance.isActive}
                        onCheckedChange={() => toggleIsActive(instance)}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {instance.status === 'disconnected' || instance.status === 'error' ? (
                        <Button
                          size="sm"
                          onClick={() => connectInstance(instance.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Power className="w-4 h-4 mr-1" />
                          Conectar
                        </Button>
                      ) : (
                        <>
                          {instance.status === 'paused' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePause(instance)}
                              className="flex-1"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Retomar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePause(instance)}
                              className="flex-1"
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pausar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => disconnectInstance(instance.id)}
                            className="flex-1"
                          >
                            <PowerOff className="w-4 h-4 mr-1" />
                            Desconectar
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openConfigDialog(instance)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Configurar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(instance)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={(open) => {
        setQrDialogOpen(open);
        if (!open) {
          setCurrentQr(''); // Limpar QR code ao fechar
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>Abra o WhatsApp no celular e escaneie o código</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {currentQr ? (
              <img src={currentQr} alt="QR Code" className="w-64 h-64 border-4 border-blue-500 rounded-lg" />
            ) : (
              <div className="w-64 h-64 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                  <p>Gerando QR Code...</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {currentQr ? 'Aguardando leitura do QR Code...' : 'Conectando ao WhatsApp...'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Instância</DialogTitle>
            <DialogDescription>Atualize as configurações da instância</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Instância</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-companyName">Nome da Empresa</Label>
              <Input
                id="edit-companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-messagesPerBatch">Mensagens por Lote</Label>
              <Input
                id="edit-messagesPerBatch"
                type="number"
                value={messagesPerBatch}
                onChange={(e) => setMessagesPerBatch(parseInt(e.target.value) || 20)}
              />
            </div>
            <div>
              <Label htmlFor="edit-proxyUrl">Proxy URL</Label>
              <Input
                id="edit-proxyUrl"
                value={proxyUrl}
                onChange={(e) => setProxyUrl(e.target.value)}
              />
            </div>
            <Button onClick={updateInstanceConfig} className="w-full">
              Salvar Configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta instância? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteInstance} className="bg-red-600 hover:bg-red-700">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
