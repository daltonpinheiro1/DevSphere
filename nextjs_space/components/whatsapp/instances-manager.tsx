
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Power, PowerOff, Trash2, QrCode, Settings, Pause, Play, RefreshCw, ShoppingCart } from 'lucide-react';
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
  chatbotId?: string;
  companyId?: string;
}

interface Chatbot {
  id: string;
  name: string;
  description?: string;
}

interface Template {
  id: string;
  name: string;
}

interface Proxy {
  id: string;
  url: string;
  country?: string;
  isActive: boolean;
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

  // Listas de opções
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [messagesPerBatch, setMessagesPerBatch] = useState(20);
  const [proxyUrl, setProxyUrl] = useState('');
  const [chatbotId, setChatbotId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    fetchInstances();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      // Buscar chatbots
      const chatbotsRes = await fetch('/api/whatsapp/chatbots');
      const chatbotsData = await chatbotsRes.json();
      setChatbots(chatbotsData.chatbots || []);

      // Buscar templates
      const templatesRes = await fetch('/api/whatsapp/templates');
      const templatesData = await templatesRes.json();
      setTemplates(templatesData.templates || []);

      // Buscar proxies
      const proxiesRes = await fetch('/api/whatsapp/proxies');
      const proxiesData = await proxiesRes.json();
      setProxies(proxiesData.proxies?.filter((p: Proxy) => p.isActive) || []);
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

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

    if (!chatbotId) {
      toast.error('Selecione um chatbot');
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
          chatbotId,
          companyId: companyId || undefined,
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
      console.log(`🔄 Iniciando conexão para instância ${id}`);
      
      const res = await fetch(`/api/whatsapp/instances/${id}/connect`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Erro ao conectar:', errorData);
        throw new Error(errorData.error || 'Erro ao conectar');
      }

      console.log('✅ Comando de conexão enviado com sucesso');
      toast.success('Conectando... Aguarde o QR Code');
      
      // Resetar estado antes de abrir o dialog
      setCurrentQr('');
      setQrDialogOpen(true);

      // Poll para atualizar QR code e status
      let hasShownQrToast = false;
      let pollCount = 0;
      const maxPolls = 60; // 60 x 2s = 2 minutos
      
      const interval = setInterval(async () => {
        pollCount++;
        console.log(`📡 Polling ${pollCount}/${maxPolls} para instância ${id}`);
        
        try {
          const statusRes = await fetch(`/api/whatsapp/instances/${id}`);
          
          if (!statusRes.ok) {
            console.error('❌ Erro ao buscar status da instância');
            return;
          }
          
          const statusData = await statusRes.json();
          const instance = statusData.instance;
          
          if (!instance) {
            console.warn('⚠️ Instância não encontrada no response');
            return;
          }
          
          console.log(`📊 Status da instância: ${instance.status}`);
          console.log(`📱 QR Code presente: ${instance.qrCode ? 'SIM' : 'NÃO'}`);
          
          // Atualizar QR code se disponível ou mudou
          if (instance.qrCode && instance.qrCode !== currentQr) {
            console.log(`✅ Novo QR Code recebido! Tamanho: ${instance.qrCode.length} chars`);
            console.log(`   QR Code preview: ${instance.qrCode.substring(0, 50)}...`);
            setCurrentQr(instance.qrCode);
            
            if (!hasShownQrToast) {
              toast.success('QR Code gerado! Escaneie para conectar');
              hasShownQrToast = true;
            }
          }
          
          // Verificar se conectou
          if (instance.status === 'connected') {
            console.log('🎉 WhatsApp conectado com sucesso!');
            clearInterval(interval);
            setQrDialogOpen(false);
            setCurrentQr('');
            toast.success('WhatsApp conectado com sucesso!');
            fetchInstances();
          }
          
          // Timeout após max polls
          if (pollCount >= maxPolls) {
            console.warn('⏱️ Timeout: limite de polling atingido');
            clearInterval(interval);
            setQrDialogOpen(false);
            setCurrentQr('');
            toast.error('Tempo limite excedido. Tente novamente.');
          }
        } catch (pollError) {
          console.error('❌ Erro durante polling:', pollError);
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao conectar instância:', error);
      toast.error('Erro ao conectar instância');
      setQrDialogOpen(false);
      setCurrentQr('');
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

  const startSalesFlow = async (instanceId: string, contactPhone: string) => {
    try {
      toast.loading('Iniciando fluxo de vendas...');
      
      const res = await fetch('/api/whatsapp/sales-flow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          contactPhone,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao iniciar fluxo de vendas');
      }

      const data = await res.json();
      
      toast.dismiss();
      toast.success('🎉 Fluxo de vendas iniciado com sucesso!');
      toast.info(`📱 Mensagem enviada para ${contactPhone}`);
      
      console.log('Fluxo iniciado:', data);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Erro ao iniciar fluxo de vendas');
      console.error('Erro ao iniciar fluxo:', error);
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
    setChatbotId('');
    setTemplateId('');
    setCompanyId('');
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
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                    <Label htmlFor="chatbot">Chatbot (IA) *</Label>
                    <Select value={chatbotId} onValueChange={setChatbotId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um chatbot" />
                      </SelectTrigger>
                      <SelectContent>
                        {chatbots.length === 0 ? (
                          <SelectItem value="no-chatbot" disabled>
                            Nenhum chatbot disponível
                          </SelectItem>
                        ) : (
                          chatbots.map((bot) => (
                            <SelectItem key={bot.id} value={bot.id}>
                              {bot.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      IA que responderá automaticamente as mensagens
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="template">Template Padrão (Opcional)</Label>
                    <Select value={templateId} onValueChange={setTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {templates.map((tpl) => (
                          <SelectItem key={tpl.id} value={tpl.id}>
                            {tpl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Template de mensagem inicial (opcional)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="companyName">Nome da Empresa (Opcional)</Label>
                    <Input
                      id="companyName"
                      placeholder="Ex: Centermed"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="proxy">Proxy (Recomendado)</Label>
                    <Select value={proxyUrl} onValueChange={setProxyUrl}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um proxy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem proxy</SelectItem>
                        {proxies.map((proxy) => (
                          <SelectItem key={proxy.id} value={proxy.url}>
                            {proxy.country || proxy.url} {proxy.isActive && '✅'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ Proxies evitam bloqueio de IP pelo WhatsApp
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="messagesPerBatch">Mensagens por Lote</Label>
                    <Input
                      id="messagesPerBatch"
                      type="number"
                      placeholder="20"
                      value={messagesPerBatch}
                      onChange={(e) => setMessagesPerBatch(parseInt(e.target.value) || 20)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Quantas mensagens enviar antes de pausar (rate limit)
                    </p>
                  </div>

                  <Button onClick={createInstance} className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Instância
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

                    {/* Botão Adquira Já! */}
                    {instance.status === 'connected' && instance.phoneNumber && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={() => startSalesFlow(instance.id, instance.phoneNumber!)}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          🎁 Adquira já!
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          Iniciar fluxo de vendas TIM
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={(open) => {
        console.log(`🔔 QR Dialog mudou para: ${open ? 'ABERTO' : 'FECHADO'}`);
        setQrDialogOpen(open);
        if (!open) {
          console.log('🧹 Limpando QR Code do estado');
          setCurrentQr(''); // Limpar QR code ao fechar
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Escaneie o QR Code
            </DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular e escaneie o código abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {currentQr ? (
              <>
                <div className="relative">
                  <img 
                    src={currentQr} 
                    alt="QR Code WhatsApp" 
                    className="w-72 h-72 border-4 border-green-500 rounded-lg shadow-lg"
                    onLoad={() => console.log('✅ Imagem QR Code carregada no DOM')}
                    onError={(e) => console.error('❌ Erro ao carregar imagem QR Code:', e)}
                  />
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2">
                    <QrCode className="w-4 h-4" />
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-medium">Aguardando leitura do QR Code...</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Abra o WhatsApp → Menu → Aparelhos conectados → Conectar aparelho
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-72 h-72 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-blue-500" />
                    <p className="font-medium">Gerando QR Code...</p>
                    <p className="text-xs mt-1">Aguarde alguns segundos</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-medium">Conectando ao WhatsApp...</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    O QR Code aparecerá em instantes
                  </p>
                </div>
              </>
            )}
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
