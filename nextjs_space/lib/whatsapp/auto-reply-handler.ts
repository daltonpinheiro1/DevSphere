
import { WebhookMessage } from './types';
import { baileysService } from './baileys-service';
import { prisma } from '../db';

/**
 * Handler para respostas automáticas usando o chatbot
 */
export class AutoReplyHandler {
  /**
   * Processa mensagem recebida e envia resposta automática
   */
  async handleMessage(message: WebhookMessage): Promise<void> {
    try {
      // Buscar instância
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: message.instanceId },
      });

      if (!instance) {
        console.log(`Instância ${message.instanceId} não encontrada`);
        return;
      }

      // Verificar se auto-reply está ativo
      if (!instance.autoReply) {
        console.log(`Auto-reply desativado para instância ${message.instanceId}`);
        return;
      }

      // Obter resposta do chatbot
      const botResponse = await this.getChatbotResponse(
        message.message,
        instance.chatbotId || undefined
      );

      if (!botResponse) {
        console.log('Nenhuma resposta gerada pelo chatbot');
        return;
      }

      // Enviar resposta
      await baileysService.sendMessage({
        instanceId: message.instanceId,
        to: message.from,
        message: botResponse,
      });

      console.log(
        `Resposta automática enviada para ${message.from} pela instância ${message.instanceId}`
      );
    } catch (error) {
      console.error('Erro ao processar resposta automática:', error);
    }
  }

  /**
   * Obtém resposta do chatbot (integração com API de chat existente)
   */
  private async getChatbotResponse(
    message: string,
    chatbotId?: string
  ): Promise<string | null> {
    try {
      // Chamar API de chat interna
      const apiUrl = process.env.ABACUSAI_API_URL || 'https://apis.abacus.ai';
      const apiKey = process.env.ABACUSAI_API_KEY;

      if (!apiKey) {
        console.error('API key não configurada');
        return null;
      }

      const response = await fetch(`${apiUrl}/v1/chat/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Você é o assistente virtual oficial da Centermed, especializado em atendimento ao cliente sobre o Clube de Serviços da Centermed.

**SOBRE A CENTERMED:**
A Centermed é uma empresa de serviços de saúde e telecomunicações que oferece soluções completas para seus clientes através do Clube de Serviços.

**SERVIÇOS OFERECIDOS:**

1. **PLANOS DE SAÚDE:**
   - Plano Básico: Consultas médicas, exames laboratoriais básicos
   - Plano Premium: Internações, cirurgias, exames complexos
   - Plano Família: Cobertura para toda a família com descontos especiais
   - Preços: A partir de R$ 199/mês (Básico), R$ 399/mês (Premium), R$ 599/mês (Família)

2. **INTERNET:**
   - Internet Fibra Óptica 100MB: R$ 79,90/mês
   - Internet Fibra Óptica 300MB: R$ 99,90/mês
   - Internet Fibra Óptica 500MB: R$ 129,90/mês
   - Internet Fibra Óptica 1GB: R$ 159,90/mês

3. **COMBOS (INTERNET + PLANO DE SAÚDE):**
   - Combo Essencial (Internet 100MB + Plano Básico): R$ 249/mês (economia de R$ 30)
   - Combo Completo (Internet 300MB + Plano Premium): R$ 449/mês (economia de R$ 50)
   - Combo Família (Internet 500MB + Plano Família): R$ 649/mês (economia de R$ 80)

**BENEFÍCIOS DO CLUBE:**
- Descontos exclusivos em farmácias parceiras (até 30%)
- Telemedicina 24/7
- Assistência técnica prioritária para internet
- Cashback de 5% nas mensalidades
- Sem fidelidade

**ÁREAS DE ATENDIMENTO:**
Atendemos em todo o Brasil com instalação em até 48 horas.

**FORMAS DE PAGAMENTO:**
- Cartão de crédito (todas as bandeiras)
- Débito automático
- PIX
- Boleto bancário

**SUA FUNÇÃO:**
- Seja sempre cordial, empático e profissional
- Responda de forma clara e objetiva
- Ofereça soluções adequadas ao perfil do cliente
- Identifique interesse em internet, plano de saúde ou combo
- Em caso de interesse, peça o nome completo e confirme o telefone para que um consultor entre em contato
- Esclareça dúvidas sobre preços, cobertura e benefícios
- Nunca invente informações - se não souber algo, seja honesto e ofereça contato com um especialista

Responda sempre em português brasileiro de forma natural e amigável. Mantenha respostas concisas (máximo 3 parágrafos).`
            },
            {
              role: 'user',
              content: message,
            },
          ],
          model: 'gpt-4o-mini',
          stream: false,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        console.error('Erro ao chamar API do chatbot:', response.statusText);
        return null;
      }

      const data = await response.json();
      const botMessage = data.choices?.[0]?.message?.content;

      return botMessage || null;
    } catch (error) {
      console.error('Erro ao obter resposta do chatbot:', error);
      return null;
    }
  }
}

export const autoReplyHandler = new AutoReplyHandler();
