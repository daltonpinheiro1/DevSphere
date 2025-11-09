
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
              role: 'user',
              content: message,
            },
          ],
          model: 'gpt-4o-mini',
          stream: false,
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
