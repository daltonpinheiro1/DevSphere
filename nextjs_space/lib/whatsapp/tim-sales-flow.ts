
import { prisma } from '../db';
import { timApi } from './tim-api';
import { conversationCache } from './conversation-cache';

type FlowStage =
  | 'initial'
  | 'awaiting_cep'
  | 'awaiting_number'
  | 'checking_viability'
  | 'selecting_plan'
  | 'collecting_address'
  | 'collecting_personal_data'
  | 'requesting_geolocation'
  | 'reviewing_data'
  | 'awaiting_authorization'
  | 'completed'
  | 'cancelled';

interface FlowResponse {
  message: string;
  nextStage: FlowStage;
  shouldSendButton?: boolean;
  buttonText?: string;
  options?: string[];
}

export class TIMSalesFlowManager {
  async getOrCreateLead(instanceId: string, contactPhone: string) {
    let lead = await prisma.tim_sales_leads.findFirst({
      where: {
        instance_id: instanceId,
        contact_phone: contactPhone,
        flow_stage: {
          not: 'completed',
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!lead) {
      lead = await prisma.tim_sales_leads.create({
        data: {
          id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          instance_id: instanceId,
          contact_phone: contactPhone,
          flow_stage: 'initial',
          viability_checked: false,
          is_viable: false,
          authorization_given: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return lead;
  }

  async handleMessage(
    instanceId: string,
    contactPhone: string,
    message: string
  ): Promise<FlowResponse> {
    const lead = await this.getOrCreateLead(instanceId, contactPhone);

    // Salva mensagem no cache de conversação
    await conversationCache.addMessage(
      instanceId,
      contactPhone,
      'user',
      message
    );

    switch (lead.flow_stage) {
      case 'initial':
        return this.handleInitialStage(lead);

      case 'awaiting_cep':
        return this.handleCepInput(lead, message);

      case 'awaiting_number':
        return this.handleNumberInput(lead, message);

      case 'selecting_plan':
        return this.handlePlanSelection(lead, message);

      case 'collecting_address':
        return this.handleAddressCollection(lead, message);

      case 'collecting_personal_data':
        return this.handlePersonalDataCollection(lead, message);

      case 'requesting_geolocation':
        return this.handleGeolocationRequest(lead, message);

      case 'reviewing_data':
        return this.handleDataReview(lead, message);

      case 'awaiting_authorization':
        return this.handleAuthorization(lead, message);

      default:
        return {
          message: 'Desculpe, ocorreu um erro. Vamos recomeçar!',
          nextStage: 'initial',
        };
    }
  }

  private async handleInitialStage(lead: any): Promise<FlowResponse> {
    await this.updateLead(lead.id, { flow_stage: 'awaiting_cep' });

    return {
      message: `🌟 *Bem-vindo à TIM!*

Que ótimo ter você aqui! Vamos verificar se temos cobertura na sua região e encontrar o plano perfeito para você! 🚀

*Para começar, me informe seu CEP:*
_(apenas números, exemplo: 01310100)_`,
      nextStage: 'awaiting_cep',
    };
  }

  private async handleCepInput(lead: any, cep: string): Promise<FlowResponse> {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return {
        message:
          '❌ CEP inválido. Por favor, digite um CEP com 8 números.\n\n*Exemplo:* 01310100',
        nextStage: 'awaiting_cep',
      };
    }

    await this.updateLead(lead.id, {
      cep: cleanCep,
      flow_stage: 'awaiting_number',
    });

    return {
      message: `✅ CEP registrado: *${cleanCep}*

Agora, me informe o *número* do seu endereço:
_(apenas o número, exemplo: 123)_`,
      nextStage: 'awaiting_number',
    };
  }

  private async handleNumberInput(
    lead: any,
    number: string
  ): Promise<FlowResponse> {
    const cleanNumber = number.replace(/\D/g, '');

    if (!cleanNumber || cleanNumber.length === 0) {
      return {
        message: '❌ Número inválido. Por favor, digite o número do endereço.',
        nextStage: 'awaiting_number',
      };
    }

    await this.updateLead(lead.id, {
      address_number: cleanNumber,
      flow_stage: 'checking_viability',
    });

    // Verifica viabilidade
    const viabilityResult = await timApi.checkViability(lead.cep, cleanNumber);

    if (!viabilityResult.viable) {
      await this.updateLead(lead.id, {
        viability_checked: true,
        is_viable: false,
        viability_response: viabilityResult,
        flow_stage: 'cancelled',
      });

      return {
        message: `😔 ${viabilityResult.message}

Mas deixe seu contato conosco! Assim que tivermos cobertura na sua região, entraremos em contato! 📞`,
        nextStage: 'cancelled',
      };
    }

    // Busca endereço completo
    const addressData = await timApi.searchAddressByCep(lead.cep);

    await this.updateLead(lead.id, {
      viability_checked: true,
      is_viable: true,
      viability_response: viabilityResult,
      street: addressData?.street,
      neighborhood: addressData?.neighborhood,
      city: addressData?.city,
      state: addressData?.state,
      flow_stage: 'selecting_plan',
    });

    // Monta lista de planos
    const plansText = viabilityResult.availablePlans
      ?.map(
        (plan, idx) =>
          `*${idx + 1}.* ${plan.name}\n   💰 R$ ${plan.price.toFixed(2)}/mês\n   📌 ${plan.description}`
      )
      .join('\n\n');

    return {
      message: `🎉 *${viabilityResult.message}*

📍 *Endereço identificado:*
${addressData?.street || 'Rua não identificada'}, ${cleanNumber}
${addressData?.neighborhood || ''} - ${addressData?.city || ''}/${addressData?.state || ''}

💎 *Planos disponíveis para você:*

${plansText}

*Digite o número do plano que deseja:*`,
      nextStage: 'selecting_plan',
      options: viabilityResult.availablePlans?.map((p) => p.name),
    };
  }

  private async handlePlanSelection(
    lead: any,
    selection: string
  ): Promise<FlowResponse> {
    const viabilityData = lead.viability_response as any;
    const planIndex = parseInt(selection) - 1;

    if (
      isNaN(planIndex) ||
      planIndex < 0 ||
      planIndex >= viabilityData.availablePlans?.length
    ) {
      return {
        message: '❌ Opção inválida. Por favor, digite o número do plano (1, 2, 3, etc.)',
        nextStage: 'selecting_plan',
      };
    }

    const selectedPlan = viabilityData.availablePlans[planIndex];

    await this.updateLead(lead.id, {
      selected_plan_type: selectedPlan.type,
      selected_plan_name: selectedPlan.name,
      plan_price: selectedPlan.price,
      flow_stage: 'collecting_address',
    });

    return {
      message: `✅ *Plano selecionado:*
${selectedPlan.name} - R$ ${selectedPlan.price.toFixed(2)}/mês

Perfeito! Agora vamos completar seu endereço. 🏠

*Por favor, informe o complemento (se houver):*
_(Ex: Apto 101, Bloco A, Casa 2, ou digite "sem complemento")_`,
      nextStage: 'collecting_address',
    };
  }

  private async handleAddressCollection(
    lead: any,
    message: string
  ): Promise<FlowResponse> {
    const complement =
      message.toLowerCase() === 'sem complemento' ? null : message;

    await this.updateLead(lead.id, {
      complement: complement,
      flow_stage: 'collecting_personal_data',
    });

    return {
      message: `📝 *Dados Pessoais*

Agora preciso dos seus dados para finalizar a contratação.

*Por favor, me informe seu NOME COMPLETO:*`,
      nextStage: 'collecting_personal_data',
    };
  }

  private async handlePersonalDataCollection(
    lead: any,
    message: string
  ): Promise<FlowResponse> {
    if (!lead.full_name) {
      await this.updateLead(lead.id, { full_name: message });
      return {
        message: `✅ Nome registrado: *${message}*

Agora, informe seu *CPF:*
_(apenas números)_`,
        nextStage: 'collecting_personal_data',
      };
    }

    if (!lead.cpf) {
      const cpf = message.replace(/\D/g, '');
      if (cpf.length !== 11) {
        return {
          message: '❌ CPF inválido. Digite os 11 dígitos do seu CPF.',
          nextStage: 'collecting_personal_data',
        };
      }

      await this.updateLead(lead.id, { cpf });
      return {
        message: `✅ CPF registrado!

Agora, informe sua *DATA DE NASCIMENTO:*
_(formato: DD/MM/AAAA)_`,
        nextStage: 'collecting_personal_data',
      };
    }

    if (!lead.birth_date) {
      const birthDate = this.parseBirthDate(message);
      if (!birthDate) {
        return {
          message:
            '❌ Data inválida. Por favor, use o formato DD/MM/AAAA\n*Exemplo:* 15/03/1990',
          nextStage: 'collecting_personal_data',
        };
      }

      await this.updateLead(lead.id, { birth_date: birthDate });
      return {
        message: `✅ Data de nascimento registrada!

Informe seu *E-MAIL:*`,
        nextStage: 'collecting_personal_data',
      };
    }

    if (!lead.email) {
      if (!this.isValidEmail(message)) {
        return {
          message: '❌ E-mail inválido. Por favor, digite um e-mail válido.',
          nextStage: 'collecting_personal_data',
        };
      }

      await this.updateLead(lead.id, {
        email: message,
        flow_stage: 'requesting_geolocation',
      });

      return {
        message: `✅ E-mail registrado!

📍 *Geolocalização*

Para garantir a instalação no local correto, você pode compartilhar sua localização comigo?

*Clique no botão abaixo para compartilhar sua localização:* 👇

_(Ou digite "pular" se preferir não compartilhar)_`,
        nextStage: 'requesting_geolocation',
        shouldSendButton: true,
        buttonText: '📍 Compartilhar Localização',
      };
    }

    return {
      message: 'Erro ao processar dados. Vamos recomeçar.',
      nextStage: 'initial',
    };
  }

  private async handleGeolocationRequest(
    lead: any,
    message: string
  ): Promise<FlowResponse> {
    if (message.toLowerCase() === 'pular') {
      await this.updateLead(lead.id, {
        flow_stage: 'reviewing_data',
      });
    } else {
      // TODO: Processar coordenadas de geolocalização se enviadas
      await this.updateLead(lead.id, {
        flow_stage: 'reviewing_data',
      });
    }

    // Monta resumo dos dados
    const summary = this.buildDataSummary(lead);

    return {
      message: `📋 *RESUMO DOS DADOS*

${summary}

*Confirma que todos os dados estão corretos?*

Digite:
*1* - Sim, está tudo correto! ✅
*2* - Não, preciso corrigir algo ❌`,
      nextStage: 'reviewing_data',
    };
  }

  private async handleDataReview(
    lead: any,
    message: string
  ): Promise<FlowResponse> {
    if (message === '1') {
      await this.updateLead(lead.id, {
        flow_stage: 'awaiting_authorization',
      });

      const authorizationText = this.buildAuthorizationScript(lead);

      return {
        message: authorizationText,
        nextStage: 'awaiting_authorization',
      };
    } else if (message === '2') {
      return {
        message:
          'Entendido! Por favor, me diga qual informação precisa ser corrigida.',
        nextStage: 'collecting_personal_data',
      };
    }

    return {
      message: '❌ Opção inválida. Digite 1 para confirmar ou 2 para corrigir.',
      nextStage: 'reviewing_data',
    };
  }

  private async handleAuthorization(
    lead: any,
    message: string
  ): Promise<FlowResponse> {
    const affirmativeWords = [
      'sim',
      'autorizo',
      'aceito',
      'concordo',
      'confirmo',
    ];
    const isAuthorized = affirmativeWords.some((word) =>
      message.toLowerCase().includes(word)
    );

    if (isAuthorized) {
      await this.updateLead(lead.id, {
        authorization_given: true,
        authorization_date: new Date(),
        authorization_text: message,
        flow_stage: 'completed',
        completed_at: new Date(),
      });

      const thankYouMessage = this.buildThankYouMessage(lead);

      return {
        message: thankYouMessage,
        nextStage: 'completed',
      };
    }

    return {
      message: `Para prosseguir, preciso da sua autorização expressa.

Por favor, responda com *"Sim, autorizo"* para finalizar a contratação. 📝`,
      nextStage: 'awaiting_authorization',
    };
  }

  private buildDataSummary(lead: any): string {
    const viabilityData = lead.viability_response as any;
    return `
👤 *Dados Pessoais:*
   Nome: ${lead.full_name || 'N/A'}
   CPF: ${this.formatCpf(lead.cpf) || 'N/A'}
   Data Nasc.: ${this.formatDate(lead.birth_date) || 'N/A'}
   E-mail: ${lead.email || 'N/A'}

📍 *Endereço:*
   ${lead.street || 'Rua não identificada'}, ${lead.address_number}
   ${lead.complement ? `Complemento: ${lead.complement}\n   ` : ''}${lead.neighborhood} - ${lead.city}/${lead.state}
   CEP: ${this.formatCep(lead.cep)}

💎 *Plano Selecionado:*
   ${lead.selected_plan_name}
   💰 R$ ${lead.plan_price?.toFixed(2)}/mês
    `.trim();
  }

  private buildAuthorizationScript(lead: any): string {
    return `
📜 *TERMO DE AUTORIZAÇÃO*

Eu, *${lead.full_name}*, portador do CPF *${this.formatCpf(lead.cpf)}*,

✅ AUTORIZO a contratação do plano:
*${lead.selected_plan_name}*
Valor mensal: R$ ${lead.plan_price?.toFixed(2)}

✅ CONFIRMO que os dados fornecidos estão corretos

✅ ACEITO os termos e condições do serviço

✅ AUTORIZO a instalação no endereço informado

🔐 *Para finalizar, digite:* 
"Sim, autorizo a contratação"
    `.trim();
  }

  private buildThankYouMessage(lead: any): string {
    return `
🎉 *PARABÉNS! CONTRATAÇÃO REALIZADA COM SUCESSO!* 🎉

${lead.full_name}, sua contratação foi finalizada! 

📋 *Próximos Passos:*

1️⃣ Você receberá um e-mail de confirmação em ${lead.email}

2️⃣ Nossa equipe entrará em contato em até 24h para agendar a instalação

3️⃣ A instalação será realizada em até 5 dias úteis

4️⃣ Você receberá um kit de boas-vindas com:
   • Roteador Wi-Fi (comodato)
   • Manual do usuário
   • Certificado de garantia

💳 *Forma de Pagamento:*
A primeira fatura chegará após a ativação do serviço

📞 *Canais de Atendimento:*
   • WhatsApp: (11) 9999-9999
   • Site: www.tim.com.br
   • App TIM

🎁 *Benefícios do seu plano:*
   • ${lead.selected_plan_name}
   • Instalação grátis
   • 30 dias de garantia de satisfação

*Obrigado por escolher a TIM!* 🚀
Prepare-se para a melhor conexão da sua vida! 

🌟 _Ficamos à disposição para qualquer dúvida!_
    `.trim();
  }

  private async updateLead(leadId: string, data: any) {
    return await prisma.tim_sales_leads.update({
      where: { id: leadId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  private parseBirthDate(dateStr: string): Date | null {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);

    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private formatCpf(cpf: string | null): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private formatCep(cep: string | null): string {
    if (!cep) return '';
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }
}

export const timSalesFlow = new TIMSalesFlowManager();
