'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, QrCode, Power, PowerOff, Trash2, RefreshCw, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface Instance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: string;
  qrCode?: string;
  autoReply: boolean;
  messagesPerBatch: number;
  currentMessageCount: number;
  proxyUrl?: string;
  lastDnsRotation?: string;
  lastConnectedAt?: string;
  isConnectedNow?: boolean;
}

export default function InstancesManager() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [messagesPerBatch, setMessagesPerBatch] = useState(50);
  const [proxyUrl, setProxyUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [configInstance, setConfigInstance] = useState<Instance | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);

  useEffect(() => {
    fetchInstances();
    // Poll para atualizar QR codes e status
    const interval = setInterval(fetchInstances, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/whatsapp/instances');
      const data = await response.json();
      if (data.success) {
        setInstances(data.instances);
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newInstanceName,
          messagesPerBatch,
          proxyUrl: proxyUrl || undefined
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Instância criada com sucesso!');
        setNewInstanceName('');
        setMessagesPerBatch(50);
        setProxyUrl('');
        setShowAdvanced(false);
        fetchInstances();
      } else {
        toast.error(data.error || 'Erro ao criar instância');
      }
    } catch (error) {
      toast.error('Erro ao criar instância');
    } finally {
      setCreating(false);
    }
  };

  const updateInstanceConfig = async () => {
    if (!configInstance) return;

    setEditingConfig(true);
    try {
      const response = await fetch(`/api/whatsapp/instances/${configInstance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messagesPerBatch: configInstance.messagesPerBatch,
          proxyUrl: configInstance.proxyUrl || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Configurações atualizadas!');
        setConfigInstance(null);
        fetchInstances();
      } else {
        toast.error(data.error || 'Erro ao atualizar');
      }
    } catch (error) {
      toast.error('Erro ao atualizar configurações');
    } finally {
      setEditingConfig(false);
    }
  };

  const connectInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/instances/${instanceId}/connect`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Conectando... Aguarde o QR Code');
        fetchInstances();
      } else {
        toast.error(data.error || 'Erro ao conectar');
      }
    } catch (error) {
      toast.error('Erro ao conectar instância');
    }
  };

  const disconnectInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/instances/${instanceId}/disconnect`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Instância desconectada');
        fetchInstances();
      } else {
        toast.error(data.error || 'Erro ao desconectar');
      }
    } catch (error) {
      toast.error('Erro ao desconectar instância');
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!confirm('Deseja realmente excluir esta instância?')) return;

    try {
      const response = await fetch(`/api/whatsapp/instances/${instanceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Instância excluída');
        fetchInstances();
      } else {
        toast.error(data.error || 'Erro ao excluir');
      }
    } catch (error) {
      toast.error('Erro ao excluir instância');
    }
  };

  const showQRCode = async (instance: Instance) => {
    setSelectedInstance(instance);
    if (instance.qrCode) {
      try {
        const url = await QRCode.toDataURL(instance.qrCode);
        setQrCodeUrl(url);
      } catch (error) {
        toast.error('Erro ao gerar QR Code');
      }
    }
  };

  const getStatusBadge = (status: string, isConnectedNow?: boolean) => {
    if (isConnectedNow) {
      return <Badge className="bg-green-500">Conectado</Badge>;
    }

    switch (status) {
      case 'connecting':
        return <Badge className="bg-yellow-500">Conectando</Badge>;
      case 'connected':
        return <Badge className="bg-green-500">Conectado</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Desconectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Instância</CardTitle>
          <CardDescription>Crie uma nova instância de WhatsApp para conectar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="instance-name">Nome da Instância</Label>
                <Input
                  id="instance-name"
                  placeholder="DevSphere.ai - Atendimento"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createInstance()}
                />
              </div>
              <Button onClick={createInstance} disabled={creating} className="self-end">
                <Plus className="h-4 w-4 mr-2" />
                {creating ? 'Criando...' : 'Criar'}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Ocultar' : 'Mostrar'} Configurações Avançadas
            </Button>

            {showAdvanced && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="messages-per-batch">Mensagens por Lote (antes de rotação)</Label>
                  <Select
                    value={messagesPerBatch.toString()}
                    onValueChange={(value) => setMessagesPerBatch(parseInt(value))}
                  >
                    <SelectTrigger id="messages-per-batch">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 mensagens</SelectItem>
                      <SelectItem value="20">20 mensagens</SelectItem>
                      <SelectItem value="50">50 mensagens (padrão)</SelectItem>
                      <SelectItem value="100">100 mensagens</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Define quantas mensagens enviar antes de rotacionar DNS/IP
                  </p>
                </div>

                <div>
                  <Label htmlFor="proxy-url">URL do Proxy/DNS Dinâmico (Opcional)</Label>
                  <Input
                    id="proxy-url"
                    placeholder="https://proxy.example.com ou deixe vazio"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure um proxy ou DNS dinâmico para rotação automática
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => (
          <Card key={instance.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{instance.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {instance.phoneNumber || 'Não conectado'}
                  </CardDescription>
                </div>
                {getStatusBadge(instance.status, instance.isConnectedNow)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {instance.status === 'connecting' && instance.qrCode && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => showQRCode(instance)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Ver QR Code
                </Button>
              )}

              <div className="flex gap-2">
                {instance.status === 'disconnected' || instance.status === 'error' ? (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => connectInstance(instance.id)}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                ) : instance.isConnectedNow ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => disconnectInstance(instance.id)}
                  >
                    <PowerOff className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setConfigInstance(instance)}
                  title="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteInstance(instance.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs space-y-1">
                {instance.autoReply && (
                  <p className="text-green-600">✓ Resposta automática ativa</p>
                )}
                <p className="text-muted-foreground">
                  Rate Limit: {instance.currentMessageCount}/{instance.messagesPerBatch} msgs
                </p>
                {instance.proxyUrl && (
                  <p className="text-blue-600">✓ Proxy configurado</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config Dialog */}
      <Dialog open={!!configInstance} onOpenChange={() => setConfigInstance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações Avançadas</DialogTitle>
            <DialogDescription>
              Configure rate limiting e rotação de DNS para {configInstance?.name}
            </DialogDescription>
          </DialogHeader>
          {configInstance && (
            <div className="space-y-4">
              <div>
                <Label>Mensagens por Lote</Label>
                <Select
                  value={configInstance.messagesPerBatch.toString()}
                  onValueChange={(value) =>
                    setConfigInstance({
                      ...configInstance,
                      messagesPerBatch: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 mensagens</SelectItem>
                    <SelectItem value="20">20 mensagens</SelectItem>
                    <SelectItem value="50">50 mensagens</SelectItem>
                    <SelectItem value="100">100 mensagens</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Quantidade de mensagens a enviar antes de rotacionar DNS/IP
                </p>
              </div>

              <div>
                <Label>URL do Proxy/DNS Dinâmico</Label>
                <Input
                  placeholder="https://proxy.example.com"
                  value={configInstance.proxyUrl || ''}
                  onChange={(e) =>
                    setConfigInstance({
                      ...configInstance,
                      proxyUrl: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para não usar proxy
                </p>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-semibold mb-2">Status Atual:</p>
                <p>Mensagens enviadas: {configInstance.currentMessageCount}</p>
                <p>Última rotação: {configInstance.lastDnsRotation || 'Nunca'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigInstance(null)}>
              Cancelar
            </Button>
            <Button onClick={updateInstanceConfig} disabled={editingConfig}>
              {editingConfig ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrCodeUrl} onOpenChange={() => setQrCodeUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular e escaneie este QR Code para conectar
            </DialogDescription>
          </DialogHeader>
          {qrCodeUrl && (
            <div className="flex justify-center p-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setQrCodeUrl(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
