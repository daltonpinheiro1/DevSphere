
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, QrCode, Power, PowerOff, Trash2, RefreshCw, Settings, Pause, Play, Activity, Building2, MessageSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

interface Instance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: string;
  qrCode?: string;
  autoReply: boolean;
  isActive: boolean;
  companyName?: string;
  messagesPerBatch: number;
  currentMessageCount: number;
  totalMessagesSent: number;
  proxyUrl?: string;
  lastDnsRotation?: string;
  lastConnectedAt?: string;
  isConnectedNow?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InstancesManager() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [messagesPerBatch, setMessagesPerBatch] = useState(50);
  const [proxyUrl, setProxyUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [configInstance, setConfigInstance] = useState<Instance | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);
  const [expandedInstances, setExpandedInstances] = useState<Set<string>>(new Set());

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
      toast.error('Por favor, insira um nome para a instância');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInstanceName,
          companyName: companyName || undefined,
          messagesPerBatch,
          proxyUrl: proxyUrl || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Instância criada com sucesso!');
        setNewInstanceName('');
        setCompanyName('');
        setProxyUrl('');
        fetchInstances();
      } else {
        toast.error(data.error || 'Erro ao criar instância');
      }
    } catch (error) {
      toast.error('Erro ao criar instância');
      console.error(error);
    } finally {
      setCreating(false);
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
      console.error(error);
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
      console.error(error);
    }
  };

  const pauseInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/instances/${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Instância pausada');
        fetchInstances();
      } else {
        toast.error(data.error || 'Erro ao pausar');
      }
    } catch (error) {
      toast.error('Erro ao pausar instância');
      console.error(error);
    }
  };

  const resumeInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/instances/${instanceId}/connect`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Instância retomada');
        fetchInstances();
      } else {
        toast.error(data.error || 'Erro ao retomar');
      }
    } catch (error) {
      toast.error('Erro ao retomar instância');
      console.error(error);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta instância? Todos os dados serão perdidos.')) {
      return;
    }

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
      console.error(error);
    }
  };

  const toggleAutoReply = async (instanceId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/whatsapp/instances/${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoReply: !currentValue }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Auto-resposta ${!currentValue ? 'ativada' : 'desativada'}`);
        fetchInstances();
      }
    } catch (error) {
      toast.error('Erro ao atualizar auto-resposta');
    }
  };

  const toggleActive = async (instanceId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/whatsapp/instances/${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentValue }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Chat ${!currentValue ? 'ativado' : 'desativado'}`);
        fetchInstances();
      }
    } catch (error) {
      toast.error('Erro ao atualizar status do chat');
    }
  };

  const updateConfig = async () => {
    if (!configInstance) return;

    setEditingConfig(true);
    try {
      const response = await fetch(`/api/whatsapp/instances/${configInstance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: configInstance.name,
          companyName: configInstance.companyName,
          messagesPerBatch: configInstance.messagesPerBatch,
          proxyUrl: configInstance.proxyUrl,
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

  const showQRCode = async (instance: Instance) => {
    if (instance.qrCode) {
      try {
        const url = await QRCode.toDataURL(instance.qrCode);
        setQrCodeUrl(url);
        setSelectedInstance(instance);
      } catch (error) {
        toast.error('Erro ao gerar QR Code');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { className: string, icon: any, label: string } } = {
      connected: { className: 'bg-green-100 text-green-800 border-green-200', icon: Power, label: 'Conectado' },
      connecting: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: RefreshCw, label: 'Conectando...' },
      disconnected: { className: 'bg-gray-100 text-gray-800 border-gray-300', icon: PowerOff, label: 'Desconectado' },
      paused: { className: 'bg-orange-100 text-orange-800 border-orange-200', icon: Pause, label: 'Pausado' },
      error: { className: 'bg-red-100 text-red-800 border-red-200', icon: PowerOff, label: 'Erro' },
    };

    const config = variants[status] || variants.disconnected;
    const Icon = config.icon;

    return (
      <Badge className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return 'Não conectado';
    // Formato: 55 31 99988-7766
    const match = phone.match(/^(\d{2})(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]}-${match[4]}`;
    }
    return phone;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (instanceId: string) => {
    const newExpanded = new Set(expandedInstances);
    if (newExpanded.has(instanceId)) {
      newExpanded.delete(instanceId);
    } else {
      newExpanded.add(instanceId);
    }
    setExpandedInstances(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando instâncias...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Logo */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12">
                <Image
                  src="https://cdn.abacus.ai/images/39b61f97-0e0e-4dce-862e-079001e361c2.png"
                  alt="DevSphere.ai Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gerenciamento de Números
                </CardTitle>
                <CardDescription>
                  Conecte e gerencie números WhatsApp ilimitados via Baileys
                </CardDescription>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Instância
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
                  <DialogDescription>
                    Configure uma nova instância para conectar um número via QR Code
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex-1">
                    <Label htmlFor="instance-name">Nome da Instância</Label>
                    <Input
                      id="instance-name"
                      placeholder="Centermed - Atendimento"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createInstance()}
                    />
                  </div>

                  <div className="flex-1">
                    <Label htmlFor="company-name">Empresa Vinculada</Label>
                    <Input
                      id="company-name"
                      placeholder="Centermed"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <Label>Configurações Avançadas</Label>
                    <Switch
                      checked={showAdvanced}
                      onCheckedChange={setShowAdvanced}
                    />
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <Label htmlFor="messages-per-batch">Mensagens por Lote</Label>
                        <Select value={messagesPerBatch.toString()} onValueChange={(v) => setMessagesPerBatch(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 mensagens</SelectItem>
                            <SelectItem value="20">20 mensagens</SelectItem>
                            <SelectItem value="50">50 mensagens (Recomendado)</SelectItem>
                            <SelectItem value="100">100 mensagens</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Quantidade de mensagens antes de rotação de IP/DNS
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="proxy-url">URL do Proxy (Opcional)</Label>
                        <Input
                          id="proxy-url"
                          placeholder="https://proxy.example.com ou deixe vazio"
                          value={proxyUrl}
                          onChange={(e) => setProxyUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={createInstance} disabled={creating}>
                    {creating ? 'Criando...' : 'Criar Instância'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Instâncias */}
      {instances.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma instância criada
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira instância para começar a enviar mensagens via WhatsApp
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => {
            const isExpanded = expandedInstances.has(instance.id);
            
            return (
              <Card key={instance.id} className="hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-6">
                  {/* Linha Principal */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Status Indicator */}
                      <div className={`w-3 h-3 rounded-full ${
                        instance.status === 'connected' ? 'bg-green-500 animate-pulse' :
                        instance.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                        instance.status === 'paused' ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`} />
                      
                      {/* Informações Principais */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{instance.name}</h3>
                          {getStatusBadge(instance.status)}
                          {!instance.isActive && (
                            <Badge variant="outline" className="gap-1 text-gray-600">
                              <PowerOff className="h-3 w-3" />
                              Chat Inativo
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-medium">{formatPhoneNumber(instance.phoneNumber)}</span>
                          </div>
                          
                          {instance.companyName && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building2 className="h-4 w-4" />
                              <span>{instance.companyName}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Activity className="h-4 w-4" />
                            <span className="font-medium text-blue-600">
                              {instance.totalMessagesSent.toLocaleString('pt-BR')} disparos
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">{formatDate(instance.lastConnectedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpand(instance.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {isExpanded && (
                    <>
                      <Separator className="my-4" />
                      
                      <div className="space-y-4">
                        {/* Estatísticas Detalhadas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Lote Atual</p>
                            <p className="text-xl font-bold text-blue-600">
                              {instance.currentMessageCount}/{instance.messagesPerBatch}
                            </p>
                          </div>
                          
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Total de Disparos</p>
                            <p className="text-xl font-bold text-green-600">
                              {instance.totalMessagesSent.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Mensagens/Lote</p>
                            <p className="text-xl font-bold text-purple-600">
                              {instance.messagesPerBatch}
                            </p>
                          </div>
                          
                          <div className="bg-orange-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Última Conexão</p>
                            <p className="text-sm font-semibold text-orange-600">
                              {formatDate(instance.lastConnectedAt).split(',')[0]}
                            </p>
                          </div>
                        </div>

                        {/* Configurações */}
                        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={instance.autoReply}
                              onCheckedChange={() => toggleAutoReply(instance.id, instance.autoReply)}
                            />
                            <Label className="text-sm">Auto-resposta IA</Label>
                          </div>
                          
                          <Separator orientation="vertical" className="h-6" />
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={instance.isActive}
                              onCheckedChange={() => toggleActive(instance.id, instance.isActive)}
                            />
                            <Label className="text-sm">Chat Ativo</Label>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-wrap gap-2">
                          {instance.status === 'disconnected' && (
                            <Button
                              size="sm"
                              onClick={() => connectInstance(instance.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Power className="h-4 w-4 mr-2" />
                              Conectar
                            </Button>
                          )}

                          {instance.status === 'connecting' && instance.qrCode && (
                            <Button
                              size="sm"
                              onClick={() => showQRCode(instance)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              Ver QR Code
                            </Button>
                          )}

                          {instance.status === 'connected' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => pauseInstance(instance.id)}
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Pausar
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => disconnectInstance(instance.id)}
                              >
                                <PowerOff className="h-4 w-4 mr-2" />
                                Desconectar
                              </Button>
                            </>
                          )}

                          {instance.status === 'paused' && (
                            <Button
                              size="sm"
                              onClick={() => resumeInstance(instance.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Retomar
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfigInstance(instance)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteInstance(instance.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>

                          {instance.status === 'connected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => connectInstance(instance.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reconectar
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog QR Code */}
      <Dialog open={!!qrCodeUrl} onOpenChange={() => { setQrCodeUrl(null); setSelectedInstance(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Escanear QR Code</DialogTitle>
            <DialogDescription>
              Use o WhatsApp para escanear este código e conectar a instância {selectedInstance?.name}
            </DialogDescription>
          </DialogHeader>
          {qrCodeUrl && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative w-64 h-64 bg-white rounded-lg p-4">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  1. Abra o WhatsApp no seu celular
                </p>
                <p className="text-sm text-gray-600">
                  2. Toque em Menu (⋮) ou Configurações e selecione "Aparelhos conectados"
                </p>
                <p className="text-sm text-gray-600">
                  3. Toque em "Conectar um aparelho"
                </p>
                <p className="text-sm text-gray-600">
                  4. Aponte seu celular para esta tela para capturar o código
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Configurações */}
      <Dialog open={!!configInstance} onOpenChange={() => setConfigInstance(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configurar Instância</DialogTitle>
            <DialogDescription>
              Ajuste as configurações da instância {configInstance?.name}
            </DialogDescription>
          </DialogHeader>
          {configInstance && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Nome da Instância</Label>
                <Input
                  id="edit-name"
                  value={configInstance.name}
                  onChange={(e) => setConfigInstance({ ...configInstance, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-company">Empresa Vinculada</Label>
                <Input
                  id="edit-company"
                  value={configInstance.companyName || ''}
                  onChange={(e) => setConfigInstance({ ...configInstance, companyName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-messages">Mensagens por Lote</Label>
                <Select 
                  value={configInstance.messagesPerBatch.toString()} 
                  onValueChange={(v) => setConfigInstance({ ...configInstance, messagesPerBatch: parseInt(v) })}
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
              </div>

              <div>
                <Label htmlFor="edit-proxy">URL do Proxy</Label>
                <Input
                  id="edit-proxy"
                  placeholder="https://proxy.example.com"
                  value={configInstance.proxyUrl || ''}
                  onChange={(e) => setConfigInstance({ ...configInstance, proxyUrl: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={updateConfig} disabled={editingConfig}>
              {editingConfig ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
