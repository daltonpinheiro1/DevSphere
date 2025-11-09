
import { WhatsAppInstanceManager } from './instance-manager';
import { prisma } from '../db';
import { SendMessageOptions, BulkSendOptions, WebhookMessage } from './types';

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
      const connectedInstances = await prisma.whatsAppInstance.findMany({
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
    companyId?: string,
    chatbotId?: string,
    messagesPerBatch?: number,
    proxyUrl?: string
  ): Promise<string> {
    try {
      const instance = await prisma.whatsAppInstance.create({
        data: {
          name,
          companyId,
          chatbotId,
          status: 'disconnected',
          autoReply: true,
          messagesPerBatch: messagesPerBatch || 50,
          proxyUrl: proxyUrl || null,
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
    instanceId: string,
    messagesPerBatch?: number,
    proxyUrl?: string | null
  ) {
    try {
      const updateData: any = {};
      
      if (messagesPerBatch !== undefined) {
        updateData.messagesPerBatch = messagesPerBatch;
      }
      
      if (proxyUrl !== undefined) {
        updateData.proxyUrl = proxyUrl;
      }

      const instance = await prisma.whatsAppInstance.update({
        where: { id: instanceId },
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
  async connectInstance(instanceId: string): Promise<void> {
    try {
      // Verificar se instância existe no banco
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: instanceId },
      });

      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      // Verificar se já está conectada
      if (this.instances.has(instanceId)) {
        console.log(`Instância ${instanceId} já está inicializada`);
        return;
      }

      // Criar gerenciador da instância
      const manager = new WhatsAppInstanceManager(instanceId);

      // Callbacks para eventos
      const onQrCode = (qr: string) => {
        console.log(`QR Code atualizado para instância ${instanceId}`);
      };

      const onStatus = (status: string) => {
        console.log(`Status atualizado para instância ${instanceId}: ${status}`);
      };

      const onMessage = (message: WebhookMessage) => {
        this.handleIncomingMessage(message);
      };

      // Conectar
      await manager.connect(onQrCode, onStatus, onMessage);

      // Armazenar instância
      this.instances.set(instanceId, manager);
    } catch (error) {
      console.error(`Erro ao conectar instância ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Desconecta uma instância
   */
  async disconnectInstance(instanceId: string): Promise<void> {
    try {
      const manager = this.instances.get(instanceId);

      if (manager) {
        await manager.disconnect();
        this.instances.delete(instanceId);
      }
    } catch (error) {
      console.error(`Erro ao desconectar instância ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Exclui uma instância
   */
  async deleteInstance(instanceId: string): Promise<void> {
    try {
      // Desconectar primeiro
      await this.disconnectInstance(instanceId);

      // Excluir do banco
      await prisma.whatsAppInstance.delete({
        where: { id: instanceId },
      });
    } catch (error) {
      console.error(`Erro ao excluir instância ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(options: SendMessageOptions): Promise<boolean> {
    try {
      const manager = this.instances.get(options.instanceId);

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
      const { instanceId, contacts, intervalMin, intervalMax, onProgress } =
        options;

      const manager = this.instances.get(instanceId);

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
            contact.phoneNumber,
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
            const delay = this.getRandomInterval(intervalMin, intervalMax);
            await this.sleep(delay * 1000);
          }
        } catch (error) {
          console.error(
            `Erro ao enviar para ${contact.phoneNumber}:`,
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
    instanceId: string,
    handler: (msg: WebhookMessage) => void
  ): void {
    this.messageHandlers.set(instanceId, handler);
  }

  /**
   * Processa mensagens recebidas
   */
  private handleIncomingMessage(message: WebhookMessage): void {
    const handler = this.messageHandlers.get(message.instanceId);

    if (handler) {
      handler(message);
    } else {
      console.log(
        `Nenhum handler registrado para instância ${message.instanceId}`
      );
    }
  }

  /**
   * Obtém todas as instâncias
   */
  async getAllInstances() {
    return await prisma.whatsAppInstance.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtém uma instância específica
   */
  async getInstance(instanceId: string) {
    return await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
    });
  }

  /**
   * Verifica se uma instância está conectada
   */
  isInstanceConnected(instanceId: string): boolean {
    const manager = this.instances.get(instanceId);
    return manager ? manager.isConnected() : false;
  }

  /**
   * Obtém gerenciador de uma instância (uso interno)
   */
  getInstanceManager(instanceId: string): WhatsAppInstanceManager | undefined {
    return this.instances.get(instanceId);
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
