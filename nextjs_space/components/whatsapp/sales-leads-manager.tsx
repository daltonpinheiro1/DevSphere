'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, DollarSign, Users, CheckCircle, XCircle, Eye, TrendingUp } from 'lucide-react';

interface Lead {
  id: string;
  instance_id: string;
  contact_phone: string;
  contact_name?: string;
  flow_stage: string;
  cep?: string;
  address_number?: string;
  viability_checked: boolean;
  is_viable: boolean;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  full_name?: string;
  cpf?: string;
  email?: string;
  selected_plan_type?: string;
  selected_plan_name?: string;
  plan_price?: number;
  authorization_given: boolean;
  authorization_date?: Date;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  authorized: number;
}

export default function SalesLeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    authorized: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (filterStage === 'all') {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(leads.filter((l) => l.flow_stage === filterStage));
    }
  }, [filterStage, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/sales-flow/leads');
      const data = await res.json();
      setLeads(data.leads || []);
      setStats(data.stats || {});
    } catch (error) {
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsDialogOpen(true);
  };

  const getStageLabel = (stage: string): string => {
    const stages: Record<string, string> = {
      initial: 'Inicial',
      awaiting_cep: 'Aguardando CEP',
      awaiting_number: 'Aguardando Número',
      checking_viability: 'Verificando Viabilidade',
      selecting_plan: 'Selecionando Plano',
      collecting_address: 'Coletando Endereço',
      collecting_personal_data: 'Coletando Dados Pessoais',
      requesting_geolocation: 'Solicitando Localização',
      reviewing_data: 'Revisando Dados',
      awaiting_authorization: 'Aguardando Autorização',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };
    return stages[stage] || stage;
  };

  const getStageBadge = (stage: string) => {
    if (stage === 'completed') {
      return <Badge className="bg-green-500">✓ Concluído</Badge>;
    }
    if (stage === 'cancelled') {
      return <Badge variant="destructive">✗ Cancelado</Badge>;
    }
    return <Badge variant="secondary">{getStageLabel(stage)}</Badge>;
  };

  const formatCurrency = (value?: number): string => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const formatCpf = (cpf?: string): string => {
    if (!cpf) return 'N/A';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (date?: Date): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR');
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
      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Users className="w-3 h-3 inline mr-1" />
              Todos os contatos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Fluxo ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Autorizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.authorized}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <DollarSign className="w-3 h-3 inline mr-1" />
              Aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <XCircle className="w-3 h-3 inline mr-1" />
              Sem cobertura
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-orange-500" />
                Leads de Vendas TIM
              </CardTitle>
              <CardDescription>
                Acompanhe o fluxo de vendas e conversões
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estágios</SelectItem>
                  <SelectItem value="awaiting_cep">Aguardando CEP</SelectItem>
                  <SelectItem value="selecting_plan">Selecionando Plano</SelectItem>
                  <SelectItem value="collecting_personal_data">Dados Pessoais</SelectItem>
                  <SelectItem value="awaiting_authorization">Aguardando Autorização</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchLeads} variant="outline">
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum lead encontrado</p>
              <p className="text-sm">Use o botão "Adquira já!" nas instâncias para iniciar vendas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Contato</th>
                    <th className="text-left p-3 font-medium">Estágio</th>
                    <th className="text-left p-3 font-medium">Plano</th>
                    <th className="text-left p-3 font-medium">Valor</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">
                            {lead.full_name || lead.contact_name || 'Sem nome'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPhone(lead.contact_phone)}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        {getStageBadge(lead.flow_stage)}
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{lead.selected_plan_name || '-'}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{formatCurrency(lead.plan_price)}</p>
                      </td>
                      <td className="p-3">
                        {lead.authorization_given ? (
                          <Badge className="bg-green-500">✓ Autorizado</Badge>
                        ) : lead.is_viable ? (
                          <Badge className="bg-blue-500">Viável</Badge>
                        ) : lead.viability_checked ? (
                          <Badge variant="destructive">Sem cobertura</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(lead)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalhes do Lead */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              Detalhes do Lead
            </DialogTitle>
            <DialogDescription>
              Informações completas do processo de venda
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              {/* Informações do Contato */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">📞 Informações de Contato</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome:</p>
                    <p className="font-medium">{selectedLead.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone:</p>
                    <p className="font-medium">{formatPhone(selectedLead.contact_phone)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CPF:</p>
                    <p className="font-medium">{formatCpf(selectedLead.cpf)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">E-mail:</p>
                    <p className="font-medium">{selectedLead.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              {selectedLead.street && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">📍 Endereço</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      {selectedLead.street}, {selectedLead.address_number}
                    </p>
                    <p>
                      {selectedLead.neighborhood} - {selectedLead.city}/{selectedLead.state}
                    </p>
                    <p>CEP: {selectedLead.cep}</p>
                  </div>
                </div>
              )}

              {/* Plano Selecionado */}
              {selectedLead.selected_plan_name && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">💎 Plano Selecionado</h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-lg">{selectedLead.selected_plan_name}</p>
                    <p>Tipo: {selectedLead.selected_plan_type}</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(selectedLead.plan_price)}
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Status e Datas */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">📊 Status do Fluxo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Estágio Atual:</span>
                    {getStageBadge(selectedLead.flow_stage)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Viabilidade:</span>
                    {selectedLead.is_viable ? (
                      <Badge className="bg-green-500">✓ Viável</Badge>
                    ) : selectedLead.viability_checked ? (
                      <Badge variant="destructive">Sem cobertura</Badge>
                    ) : (
                      <Badge variant="secondary">Não verificado</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Autorização:</span>
                    {selectedLead.authorization_given ? (
                      <Badge className="bg-green-500">✓ Autorizado</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </div>
                  <div className="pt-2 border-t mt-2">
                    <p className="text-muted-foreground">Criado em:</p>
                    <p className="font-medium">{formatDate(selectedLead.created_at)}</p>
                  </div>
                  {selectedLead.authorization_date && (
                    <div>
                      <p className="text-muted-foreground">Autorizado em:</p>
                      <p className="font-medium">{formatDate(selectedLead.authorization_date)}</p>
                    </div>
                  )}
                  {selectedLead.completed_at && (
                    <div>
                      <p className="text-muted-foreground">Concluído em:</p>
                      <p className="font-medium">{formatDate(selectedLead.completed_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
