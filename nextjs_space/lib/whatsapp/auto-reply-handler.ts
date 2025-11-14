
import { WebhookMessage } from './types';
import { baileysService } from './baileys-service';
import { prisma } from '../db';
import { conversationCache } from './conversation-cache';
import { timSalesFlow } from './tim-sales-flow';
import { getCache, setCache } from '../redis';
import crypto from 'crypto';

/**
 * Handler para respostas automáticas usando o chatbot
 */
export class AutoReplyHandler {
  /**
   * Processa mensagem recebida e envia resposta automática
   */
  async handleMessage(message: WebhookMessage): Promise<void> {
    try {
      // Buscar instância com chatbot
      const instance = await prisma.whatsapp_instances.findUnique({
        where: { id: message.instance_id },
        include: {
          chatbots: {
            include: {
              training_files: true,
            },
          },
        },
      });

      if (!instance) {
        console.log(`Instância ${message.instance_id} não encontrada`);
        return;
      }

      // Verificar se auto-reply está ativo
      if (!instance.auto_reply) {
        console.log(`Auto-reply desativado para instância ${message.instance_id}`);
        return;
      }

      // Salvar mensagem do usuário no cache
      await conversationCache.addMessage(
        message.instance_id,
        message.from,
        'user',
        message.message
      );

      // Verificar se há fluxo de vendas ativo
      const hasActiveSalesFlow = await this.checkActiveSalesFlow(
        message.instance_id,
        message.from
      );

      let botResponse: string | null = null;

      if (hasActiveSalesFlow) {
        // Processar fluxo de vendas TIM
        const flowResponse = await timSalesFlow.handleMessage(
          message.instance_id,
          message.from,
          message.message
        );

        botResponse = flowResponse.message;

        // Enviar botão se necessário
        if (flowResponse.shouldSendButton && flowResponse.buttonText) {
          // TODO: Implementar envio de botão interativo
        }
      } else {
        // Obter resposta do chatbot normal
        botResponse = await this.getChatbotResponse(
          message.message,
          message.instance_id,
          message.from,
          instance.chatbots || undefined
        );
      }

      if (!botResponse) {
        console.log('Nenhuma resposta gerada pelo chatbot');
        return;
      }

      // Salvar resposta do bot no cache
      await conversationCache.addMessage(
        message.instance_id,
        message.from,
        'assistant',
        botResponse
      );

      // Enviar resposta
      await baileysService.sendMessage({
        instance_id: message.instance_id,
        to: message.from,
        message: botResponse,
      });

      console.log(
        `Resposta automática enviada para ${message.from} pela instância ${message.instance_id}`
      );
    } catch (error) {
      console.error('Erro ao processar resposta automática:', error);
    }
  }

  /**
   * Verifica se há fluxo de vendas ativo para o contato
   */
  private async checkActiveSalesFlow(
    instance_id: string,
    contactPhone: string
  ): Promise<boolean> {
    try {
      const activeLead = await prisma.tim_sales_leads.findFirst({
        where: {
          instance_id: instance_id,
          contact_phone: contactPhone,
          flow_stage: {
            notIn: ['completed', 'cancelled'],
          },
        },
      });

      return !!activeLead;
    } catch (error) {
      console.error('Erro ao verificar fluxo de vendas:', error);
      return false;
    }
  }

  /**
   * Gera hash de mensagem para cache
   */
  private generateMessageHash(message: string): string {
    return crypto.createHash('md5').update(message.toLowerCase().trim()).digest('hex');
  }

  /**
   * Verifica cache de respostas similares
   */
  private async getCachedSimilarResponse(message: string): Promise<string | null> {
    const messageHash = this.generateMessageHash(message);
    const cacheKey = `response:${messageHash}`;
    return await getCache<string>(cacheKey);
  }

  /**
   * Salva resposta no cache
   */
  private async cacheResponse(message: string, response: string): Promise<void> {
    const messageHash = this.generateMessageHash(message);
    const cacheKey = `response:${messageHash}`;
    // Cache de 4-6 horas (usando 5 horas como média)
    await setCache(cacheKey, response, 18000); // 5 horas
  }

  /**
   * Obtém resposta do chatbot (integração com API de chat existente)
   */
  private async getChatbotResponse(
    message: string,
    instance_id: string,
    contactPhone: string,
    chatbot?: any
  ): Promise<string | null> {
    try {
      // Verificar cache de respostas similares
      const cachedResponse = await this.getCachedSimilarResponse(message);
      if (cachedResponse) {
        console.log('✅ Resposta encontrada no cache (economia de tokens)');
        return cachedResponse;
      }

      // Buscar system prompt do chatbot no banco
      let systemPrompt = `Você é o assistente virtual oficial da DevSphere.ai, especializado em atendimento ao cliente sobre o Clube de Serviços.

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

Responda sempre em português brasileiro de forma natural e amigável. Mantenha respostas concisas (máximo 3 parágrafos).`;

      // Se chatbot foi fornecido, usar o prompt personalizado
      if (chatbot?.system_prompt) {
        systemPrompt = chatbot.system_prompt;
        console.log(`✅ Usando chatbot personalizado: ${chatbot.name}`);

        // Adicionar contexto dos arquivos de treinamento se houver
        if (chatbot.training_files && chatbot.training_files.length > 0) {
          systemPrompt += `\n\n**ARQUIVOS DE TREINAMENTO:**\nVocê foi treinado com ${chatbot.training_files.length} arquivo(s) adicional(is) com informações específicas. Use esse conhecimento para fornecer respostas mais precisas.`;
        }
      }

      // Buscar contexto da conversa no cache
      const conversationContext = await conversationCache.buildContextForAI(
        instance_id,
        contactPhone
      );

      // Construir mensagens com contexto
      const messages: any[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      // Adicionar contexto da conversa se houver
      if (conversationContext) {
        messages.push({
          role: 'system',
          content: `**CONTEXTO DA CONVERSA:**\n${conversationContext}`,
        });
      }

      // Adicionar mensagem atual do usuário
      messages.push({
        role: 'user',
        content: message,
      });

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
          messages,
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

      // Salvar resposta no cache para futuras perguntas similares
      if (botMessage) {
        await this.cacheResponse(message, botMessage);
      }

      return botMessage || null;
    } catch (error) {
      console.error('Erro ao obter resposta do chatbot:', error);
      return null;
    }
  }
}

export const autoReplyHandler = new AutoReplyHandler();
