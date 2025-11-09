'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignsManager() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  
  const [name, setName] = useState('');
  const [selectedInstance, setSelectedInstance] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [intervalMin, setIntervalMin] = useState(3);
  const [intervalMax, setIntervalMax] = useState(10);
  const [riskLevel, setRiskLevel] = useState('medium');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  useEffect(() => {
    fetchCampaigns();
    fetchInstances();
    fetchTemplates();
    fetchContacts();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/whatsapp/campaigns');
      const data = await response.json();
      if (data.success) setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    const response = await fetch('/api/whatsapp/instances');
    const data = await response.json();
    if (data.success) setInstances(data.instances.filter((i: any) => i.isConnectedNow));
  };

  const fetchTemplates = async () => {
    const response = await fetch('/api/whatsapp/templates');
    const data = await response.json();
    if (data.success) setTemplates(data.templates);
  };

  const fetchContacts = async () => {
    const response = await fetch('/api/whatsapp/contacts');
    const data = await response.json();
    if (data.success) setContacts(data.contacts);
  };

  const createCampaign = async () => {
    if (!name || !selectedInstance || selectedContactIds.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const selectedContacts = contacts.filter(c => selectedContactIds.includes(c.id));
    const template = templates.find(t => t.id === selectedTemplate);

    const contactsData = selectedContacts.map(contact => ({
      phoneNumber: contact.phoneNumber,
      message: template?.content || 'Olá!',
      name: contact.name,
      variables: {}
    }));

    try {
      const response = await fetch('/api/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          instanceId: selectedInstance,
          templateId: selectedTemplate || null,
          contacts: contactsData,
          intervalMin,
          intervalMax,
          riskLevel
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Campanha criada!');
        resetForm();
        fetchCampaigns();
      } else {
        toast.error(data.error || 'Erro ao criar');
      }
    } catch (error) {
      toast.error('Erro ao criar campanha');
    }
  };

  const startCampaign = async (id: string) => {
    try {
      const response = await fetch(`/api/whatsapp/campaigns/${id}/start`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Campanha iniciada!');
        fetchCampaigns();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Erro ao iniciar');
    }
  };

  const pauseCampaign = async (id: string) => {
    try {
      await fetch(`/api/whatsapp/campaigns/${id}/pause`, { method: 'POST' });
      toast.success('Campanha pausada');
      fetchCampaigns();
    } catch (error) {
      toast.error('Erro ao pausar');
    }
  };

  const cancelCampaign = async (id: string) => {
    try {
      await fetch(`/api/whatsapp/campaigns/${id}/cancel`, { method: 'POST' });
      toast.success('Campanha cancelada');
      fetchCampaigns();
    } catch (error) {
      toast.error('Erro ao cancelar');
    }
  };

  const resetForm = () => {
    setName('');
    setSelectedInstance('');
    setSelectedTemplate('');
    setSelectedContactIds([]);
    setShowDialog(false);
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      draft: <Badge variant="outline">Rascunho</Badge>,
      scheduled: <Badge className="bg-blue-500">Agendada</Badge>,
      running: <Badge className="bg-green-500">Rodando</Badge>,
      paused: <Badge className="bg-yellow-500">Pausada</Badge>,
      completed: <Badge className="bg-gray-500">Concluída</Badge>,
      cancelled: <Badge variant="destructive">Cancelada</Badge>
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Campanhas de Envio</CardTitle>
              <CardDescription>Gerencie suas campanhas de envio em massa</CardDescription>
            </div>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma campanha criada</div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Instância: {campaign.instance.name}</p>
                          <p>Progresso: {campaign.sentCount}/{campaign.totalContacts} enviadas</p>
                          {campaign.failedCount > 0 && (
                            <p className="text-red-600">{campaign.failedCount} falhas</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <Button size="sm" onClick={() => startCampaign(campaign.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {campaign.status === 'running' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => pauseCampaign(campaign.id)}>
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => cancelCampaign(campaign.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={resetForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Nome da Campanha</Label>
              <Input placeholder="DevSphere.ai - Novembro 2025" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            
            <div>
              <Label>Instância WhatsApp</Label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instância" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Template (opcional)</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Mensagem personalizada" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Intervalo Mín (s)</Label>
                <Input type="number" value={intervalMin} onChange={(e) => setIntervalMin(+e.target.value)} />
              </div>
              <div>
                <Label>Intervalo Máx (s)</Label>
                <Input type="number" value={intervalMax} onChange={(e) => setIntervalMax(+e.target.value)} />
              </div>
              <div>
                <Label>Nível de Risco</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Contatos ({selectedContactIds.length} selecionados)</Label>
              <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                {contacts.slice(0, 50).map(c => (
                  <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContactIds([...selectedContactIds, c.id]);
                        } else {
                          setSelectedContactIds(selectedContactIds.filter(id => id !== c.id));
                        }
                      }}
                    />
                    <span className="text-sm">{c.name || c.phoneNumber}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={createCampaign}>Criar Campanha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
