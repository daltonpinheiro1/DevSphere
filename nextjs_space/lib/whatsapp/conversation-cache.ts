
import { getCache, setCache, deleteCache } from '../redis';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ConversationContext {
  instance_id: string;
  contactPhone: string;
  messages: ConversationMessage[];
  lastUpdated: number;
}

const CONVERSATION_EXPIRY = 21600; // 6 horas

export class ConversationCache {
  private getCacheKey(instanceId: string, contactPhone: string): string {
    return `conversation:${instanceId}:${contactPhone}`;
  }

  async getConversation(
    instance_id: string,
    contactPhone: string
  ): Promise<ConversationContext | null> {
    const key = this.getCacheKey(instance_id, contactPhone);
    const cached = await getCache<ConversationContext>(key);

    if (cached) {
      // Verifica se não expirou (4-6 horas)
      const now = Date.now();
      const age = (now - cached.lastUpdated) / 1000 / 60 / 60; // em horas

      if (age < 6) {
        return cached;
      }

      // Se passou de 6 horas, limpa o cache
      await this.clearConversation(instance_id, contactPhone);
      return null;
    }

    return null;
  }

  async addMessage(
    instance_id: string,
    contactPhone: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const key = this.getCacheKey(instance_id, contactPhone);
    let context = await this.getConversation(instance_id, contactPhone);

    if (!context) {
      context = {
        instance_id,
        contactPhone,
        messages: [],
        lastUpdated: Date.now(),
      };
    }

    context.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Limita a 20 mensagens mais recentes para economizar memória
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }

    context.lastUpdated = Date.now();

    await setCache(key, context, CONVERSATION_EXPIRY);
  }

  async getRecentMessages(
    instance_id: string,
    contactPhone: string,
    limit: number = 10
  ): Promise<ConversationMessage[]> {
    const context = await this.getConversation(instance_id, contactPhone);
    if (!context) {
      return [];
    }

    return context.messages.slice(-limit);
  }

  async clearConversation(
    instance_id: string,
    contactPhone: string
  ): Promise<void> {
    const key = this.getCacheKey(instance_id, contactPhone);
    await deleteCache(key);
  }

  async buildContextForAI(
    instance_id: string,
    contactPhone: string
  ): Promise<string> {
    const messages = await this.getRecentMessages(instance_id, contactPhone, 10);

    if (messages.length === 0) {
      return '';
    }

    return messages
      .map((msg) => {
        const label = msg.role === 'user' ? 'Cliente' : 'Assistente';
        return `${label}: ${msg.content}`;
      })
      .join('\n');
  }
}

export const conversationCache = new ConversationCache();
