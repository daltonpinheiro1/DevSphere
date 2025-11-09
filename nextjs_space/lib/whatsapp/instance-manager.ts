
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  WAMessage,
  ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import { prisma } from '../db';

export class WhatsAppInstanceManager {
  private sock: WASocket | null = null;
  private instanceId: string;
  private sessionPath: string;
  private qrCodeCallback?: (qr: string) => void;
  private statusCallback?: (status: string) => void;
  private messageCallback?: (message: any) => void;
  private isConnecting = false;

  constructor(instanceId: string) {
    this.instanceId = instanceId;
    this.sessionPath = path.join(
      process.cwd(),
      'whatsapp_sessions',
      instanceId
    );
  }

  /**
   * Inicializa a conexão com WhatsApp
   */
  async connect(
    onQrCode?: (qr: string) => void,
    onStatus?: (status: string) => void,
    onMessage?: (message: any) => void
  ): Promise<void> {
    if (this.isConnecting || this.sock) {
      console.log(`Instância ${this.instanceId} já está conectando/conectada`);
      return;
    }

    this.isConnecting = true;
    this.qrCodeCallback = onQrCode;
    this.statusCallback = onStatus;
    this.messageCallback = onMessage;

    try {
      // Criar diretório de sessão se não existir
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      // Autenticação multi-arquivo
      const { state, saveCreds } = await useMultiFileAuthState(
        this.sessionPath
      );

      // Criar socket
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['DevSphere.ai', 'Chrome', '120.0.0'],
      });

      // Event: Atualização de conexão
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      // Event: Credenciais atualizadas
      this.sock.ev.on('creds.update', saveCreds);

      // Event: Mensagens recebidas
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const msg of messages) {
            await this.handleIncomingMessage(msg);
          }
        }
      });

      await this.updateStatus('connecting');
    } catch (error) {
      console.error(`Erro ao conectar instância ${this.instanceId}:`, error);
      this.isConnecting = false;
      await this.updateStatus('error');
      throw error;
    }
  }

  /**
   * Processa atualizações de conexão
   */
  private async handleConnectionUpdate(
    update: Partial<ConnectionState>
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    // QR Code gerado
    if (qr) {
      console.log(`QR Code gerado para instância ${this.instanceId}`);
      if (this.qrCodeCallback) {
        this.qrCodeCallback(qr);
      }
      await this.updateQRCode(qr);
    }

    // Conexão estabelecida
    if (connection === 'open') {
      console.log(`Instância ${this.instanceId} conectada com sucesso!`);
      this.isConnecting = false;

      // Pegar número do telefone
      const phoneNumber = this.sock?.user?.id?.split(':')[0] || '';

      await this.updateStatus('connected', phoneNumber);

      if (this.statusCallback) {
        this.statusCallback('connected');
      }
    }

    // Conexão fechada
    if (connection === 'close') {
      this.isConnecting = false;
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log(
        `Conexão fechada para instância ${this.instanceId}. Reconectar?`,
        shouldReconnect
      );

      if (shouldReconnect) {
        await this.updateStatus('disconnected');
        // Tentar reconectar após 5 segundos
        setTimeout(() => {
          if (!this.sock) {
            this.connect(
              this.qrCodeCallback,
              this.statusCallback,
              this.messageCallback
            );
          }
        }, 5000);
      } else {
        // Logout - limpar sessão
        await this.clearSession();
        await this.updateStatus('disconnected');
      }
    }
  }

  /**
   * Processa mensagens recebidas
   */
  private async handleIncomingMessage(msg: WAMessage): Promise<void> {
    try {
      // Ignorar mensagens enviadas por nós
      if (msg.key.fromMe) return;

      // Extrair conteúdo da mensagem
      const messageContent =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      if (!messageContent) return;

      const remoteJid = msg.key.remoteJid || '';
      const messageId = msg.key.id || '';

      console.log(
        `Mensagem recebida na instância ${this.instanceId}: ${messageContent}`
      );

      // Salvar mensagem no banco
      await prisma.whatsAppMessage.create({
        data: {
          instanceId: this.instanceId,
          remoteJid,
          messageId,
          fromMe: false,
          content: messageContent,
          messageType: 'text',
          timestamp: new Date(msg.messageTimestamp as number * 1000),
        },
      });

      // Callback para processamento externo (resposta automática)
      if (this.messageCallback) {
        this.messageCallback({
          instanceId: this.instanceId,
          from: remoteJid,
          message: messageContent,
          messageId,
          timestamp: new Date(msg.messageTimestamp as number * 1000),
        });
      }
    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
    }
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(to: string, message: string, mediaUrl?: string): Promise<boolean> {
    try {
      if (!this.sock) {
        throw new Error('Socket não conectado');
      }

      // Obter configurações da instância para rate limiting
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: this.instanceId },
      });

      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      // Verificar se precisa rotacionar DNS
      if (instance.currentMessageCount >= instance.messagesPerBatch) {
        await this.rotateDNS(instance);
      }

      // Formatar número no padrão do WhatsApp
      const jid = this.formatPhoneNumber(to);

      // Se houver mídia, enviar com imagem
      if (mediaUrl) {
        await this.sock.sendMessage(jid, { 
          image: { url: mediaUrl },
          caption: message 
        });
      } else {
        await this.sock.sendMessage(jid, { text: message });
      }

      // Salvar mensagem enviada no banco
      await prisma.whatsAppMessage.create({
        data: {
          instanceId: this.instanceId,
          remoteJid: jid,
          messageId: `sent-${Date.now()}`,
          fromMe: true,
          content: message,
          messageType: mediaUrl ? 'image' : 'text',
          status: 'sent',
        },
      });

      // Incrementar contador de mensagens
      await prisma.whatsAppInstance.update({
        where: { id: this.instanceId },
        data: {
          currentMessageCount: {
            increment: 1,
          },
        },
      });

      console.log(`Mensagem enviada para ${to} (${instance.currentMessageCount + 1}/${instance.messagesPerBatch})`);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar mensagem para ${to}:`, error);
      return false;
    }
  }

  /**
   * Rotaciona DNS/IP - reseta contador e atualiza timestamp
   */
  private async rotateDNS(instance: any): Promise<void> {
    try {
      console.log(`Rotacionando DNS para instância ${instance.name}...`);
      
      // Se houver proxy configurado, pode fazer lógica adicional aqui
      if (instance.proxyUrl) {
        // Aqui pode fazer uma chamada para o proxy/DNS dinâmico
        console.log(`Proxy configurado: ${instance.proxyUrl}`);
      }

      // Resetar contador e atualizar timestamp
      await prisma.whatsAppInstance.update({
        where: { id: this.instanceId },
        data: {
          currentMessageCount: 0,
          lastDnsRotation: new Date(),
        },
      });

      console.log(`DNS rotacionado para instância ${instance.name}`);
    } catch (error) {
      console.error('Erro ao rotacionar DNS:', error);
    }
  }

  /**
   * Formata número de telefone para o padrão WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Se não começar com código do país, adicionar 55 (Brasil)
    const withCountryCode = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    return `${withCountryCode}@s.whatsapp.net`;
  }

  /**
   * Desconecta a instância
   */
  async disconnect(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.sock = null;
      }
      await this.clearSession();
      await this.updateStatus('disconnected');
    } catch (error) {
      console.error(`Erro ao desconectar instância ${this.instanceId}:`, error);
    }
  }

  /**
   * Limpa dados da sessão
   */
  private async clearSession(): Promise<void> {
    try {
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
      }

      // Limpar QR code e session data do banco
      await prisma.whatsAppInstance.update({
        where: { id: this.instanceId },
        data: {
          qrCode: null,
          sessionData: null,
          phoneNumber: null,
        },
      });
    } catch (error) {
      console.error(`Erro ao limpar sessão ${this.instanceId}:`, error);
    }
  }

  /**
   * Atualiza status no banco de dados
   */
  private async updateStatus(
    status: string,
    phoneNumber?: string
  ): Promise<void> {
    try {
      const data: any = { status };

      if (phoneNumber) {
        data.phoneNumber = phoneNumber;
        data.lastConnectedAt = new Date();
      }

      await prisma.whatsAppInstance.update({
        where: { id: this.instanceId },
        data,
      });
    } catch (error) {
      console.error(`Erro ao atualizar status da instância:`, error);
    }
  }

  /**
   * Atualiza QR Code no banco de dados
   */
  private async updateQRCode(qr: string): Promise<void> {
    try {
      await prisma.whatsAppInstance.update({
        where: { id: this.instanceId },
        data: { qrCode: qr },
      });
    } catch (error) {
      console.error(`Erro ao atualizar QR code:`, error);
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.sock !== null && this.sock !== undefined;
  }

  /**
   * Obtém o socket (para uso avançado)
   */
  getSocket(): WASocket | null {
    return this.sock;
  }
}
