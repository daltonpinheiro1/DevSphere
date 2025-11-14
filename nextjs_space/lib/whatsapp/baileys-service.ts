
import { WhatsAppInstanceManager } from './instance-manager';
import { prisma } from '../db';
import { SendMessageOptions, BulkSendOptions, WebhookMessage } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço principal de gerenciamento do Baileys
 * Gerencia múltiplas instâncias de WhatsApp
 */
class BaileysService {
  private instances: Map<string, WhatsAppInstanceManager> = new Map();
  private messageHandlers: Map<string, (msg: WebhookMessage) => void> =
    new Map();

  /**
   * Inicializa o serviço e carrega instâncias conectadas
   */
  async initialize(): Promise<void> {
    try {
      // Buscar instâncias que estavam conectadas
      const connectedInstances = await prisma.whatsapp_instances.findMany({
        where: {
          status: { in: ['connected', 'connecting'] },
        },
      });

      console.log(
        `Inicializando ${connectedInstances.length} instâncias WhatsApp...`
      );

      // Tentar reconectar instâncias
      for (const instance of connectedInstances) {
        try {
          await this.connectInstance(instance.id);
        } catch (error) {
          console.error(
            `Erro ao reconectar instância ${instance.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar Baileys Service:', error);
    }
  }

  /**
   * Cria uma nova instância
   */
  async createInstance(
    name: string,
    company_id?: string,
    chatbotId?: string,
    messagesPerBatch?: number,
    proxyUrl?: string,
    companyName?: string
  ): Promise<string> {
    try {
      const instance = await prisma.whatsapp_instances.create({
        data: {
          id: uuidv4(),
          name,
          company_id,
          company_name: companyName,
          chatbot_id: chatbotId,
          status: 'disconnected',
          auto_reply: true,
          is_active: true,
          messages_per_batch: messagesPerBatch || 50,
          proxy_url: proxyUrl || null,
          updated_at: new Date(),
        },
      });

      return instance.id;
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      throw error;
    }
  }

  /**
   * Atualiza configurações de uma instância
   */
  async updateInstanceConfig(
    instance_id: string,
    config: {
      name?: string;
      companyName?: string;
      messagesPerBatch?: number;
      proxyUrl?: string | null;
      autoReply?: boolean;
      is_active?: boolean;
      status?: string;
    }
  ) {
    try {
      const updateData: any = {};
      
      if (config.name !== undefined) {
        updateData.name = config.name;
      }
      
      if (config.companyName !== undefined) {
        updateData.companyName = config.companyName;
      }
      
      if (config.messagesPerBatch !== undefined) {
        updateData.messagesPerBatch = config.messagesPerBatch;
      }
      
      if (config.proxyUrl !== undefined) {
        updateData.proxyUrl = config.proxyUrl;
      }
      
      if (config.autoReply !== undefined) {
        updateData.autoReply = config.autoReply;
      }
      
      if (config.is_active !== undefined) {
        updateData.is_active = config.is_active;
      }
      
      if (config.status !== undefined) {
        updateData.status = config.status;
      }

      const instance = await prisma.whatsapp_instances.update({
        where: { id: instance_id },
        data: updateData,
      });

      return instance;
    } catch (error) {
      console.error('Erro ao atualizar instância:', error);
      throw error;
    }
  }

  /**
   * Conecta uma instância existente
   */
  async connectInstance(instance_id: string): Promise<void> {
    try {
      // Verificar se instância existe no banco
      const instance = await prisma.whatsapp_instances.findUnique({
        where: { id: instance_id },
      });

      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      // Verificar se já está conectada
      if (this.instances.has(instance_id)) {
        console.log(`Instância ${instance_id} já está inicializada`);
        return;
      }

      // Criar gerenciador da instância
      const manager = new WhatsAppInstanceManager(instance_id);

      // Callbacks para eventos
      const onQrCode = (qr: string) => {
        console.log(`QR Code atualizado para instância ${instance_id}`);
      };

      const onStatus = (status: string) => {
        console.log(`Status atualizado para instância ${instance_id}: ${status}`);
      };

      const onMessage = (message: WebhookMessage) => {
        this.handleIncomingMessage(message);
      };

      // Conectar
      await manager.connect(onQrCode, onStatus, onMessage);

      // Armazenar instância
      this.instances.set(instance_id, manager);
    } catch (error) {
      console.error(`Erro ao conectar instância ${instance_id}:`, error);
      throw error;
    }
  }

  /**
   * Desconecta uma instância
   */
  async disconnectInstance(instance_id: string): Promise<void> {
    try {
      const manager = this.instances.get(instance_id);

      if (manager) {
        await manager.disconnect();
        this.instances.delete(instance_id);
      }
    } catch (error) {
      console.error(`Erro ao desconectar instância ${instance_id}:`, error);
      throw error;
    }
  }

  /**
   * Exclui uma instância
   */
  async deleteInstance(instance_id: string): Promise<void> {
    try {
      // Desconectar primeiro
      await this.disconnectInstance(instance_id);

      // Excluir do banco
      await prisma.whatsapp_instances.delete({
        where: { id: instance_id },
      });
    } catch (error) {
      console.error(`Erro ao excluir instância ${instance_id}:`, error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(options: SendMessageOptions): Promise<boolean> {
    try {
      const manager = this.instances.get(options.instance_id);

      if (!manager || !manager.isConnected()) {
        throw new Error('Instância não conectada');
      }

      // Aguardar delay se especificado
      if (options.delayMs) {
        await this.sleep(options.delayMs);
      }

      return await manager.sendMessage(options.to, options.message, options.mediaUrl);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  /**
   * Envia mensagens em massa
   */
  async sendBulkMessages(options: BulkSendOptions): Promise<void> {
    try {
      const { instance_id, contacts, interval_min, interval_max, onProgress } =
        options;

      const manager = this.instances.get(instance_id);

      if (!manager || !manager.isConnected()) {
        throw new Error('Instância não conectada');
      }

      const total = contacts.length;
      let sent = 0;
      let failed = 0;

      for (const contact of contacts) {
        try {
          // Enviar mensagem
          const success = await manager.sendMessage(
            contact.phone_number,
            contact.message,
            contact.mediaUrl
          );

          if (success) {
            sent++;
            if (onProgress) {
              onProgress(sent, total, 'sent');
            }
          } else {
            failed++;
            if (onProgress) {
              onProgress(sent, total, 'failed');
            }
          }

          // Aguardar intervalo aleatório entre envios
          if (sent + failed < total) {
            const delay = this.getRandomInterval(interval_min, interval_max);
            await this.sleep(delay * 1000);
          }
        } catch (error) {
          console.error(
            `Erro ao enviar para ${contact.phone_number}:`,
            error
          );
          failed++;
          if (onProgress) {
            onProgress(sent, total, 'failed');
          }
        }
      }

      console.log(
        `Envio em massa finalizado: ${sent} enviadas, ${failed} falhas`
      );
    } catch (error) {
      console.error('Erro no envio em massa:', error);
      throw error;
    }
  }

  /**
   * Registra handler para mensagens recebidas de uma instância
   */
  registerMessageHandler(
    instance_id: string,
    handler: (msg: WebhookMessage) => void
  ): void {
    this.messageHandlers.set(instance_id, handler);
  }

  /**
   * Processa mensagens recebidas
   */
  private handleIncomingMessage(message: WebhookMessage): void {
    const handler = this.messageHandlers.get(message.instance_id);

    if (handler) {
      handler(message);
    } else {
      console.log(
        `Nenhum handler registrado para instância ${message.instance_id}`
      );
    }
  }

  /**
   * Obtém todas as instâncias
   */
  async getAllInstances() {
    return await prisma.whatsapp_instances.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Obtém uma instância específica
   */
  async getInstance(instance_id: string) {
    return await prisma.whatsapp_instances.findUnique({
      where: { id: instance_id },
    });
  }

  /**
   * Verifica se uma instância está conectada
   */
  isInstanceConnected(instance_id: string): boolean {
    const manager = this.instances.get(instance_id);
    return manager ? manager.isConnected() : false;
  }

  /**
   * Obtém gerenciador de uma instância (uso interno)
   */
  getInstanceManager(instance_id: string): WhatsAppInstanceManager | undefined {
    return this.instances.get(instance_id);
  }

  /**
   * Utilitários
   */
  private getRandomInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton
export const baileysService = new BaileysService();
