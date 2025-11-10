
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  WAMessage,
  ConnectionState,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import QRCode from 'qrcode';
import { prisma } from '../db';
import { proxyPool, ProxyConfig } from './proxy-pool';

export class WhatsAppInstanceManager {
  private sock: WASocket | null = null;
  private instanceId: string;
  private sessionPath: string;
  private qrCodeCallback?: (qr: string) => void;
  private statusCallback?: (status: string) => void;
  private messageCallback?: (message: any) => void;
  private isConnecting = false;
  private currentProxy: ProxyConfig | null = null;

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

    console.log(`🔌 Iniciando conexão da instância ${this.instanceId}...`);
    this.isConnecting = true;
    this.qrCodeCallback = onQrCode;
    this.statusCallback = onStatus;
    this.messageCallback = onMessage;

    try {
      // Aguardar um pouco antes de conectar (evitar rate limiting)
      console.log(`⏳ Aguardando 3s antes de iniciar conexão...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Limpar QR code antigo no banco de dados
      console.log(`🧹 Limpando QR code antigo da instância ${this.instanceId}...`);
      await prisma.whatsAppInstance.update({
        where: { id: this.instanceId },
        data: { qrCode: null },
      });

      // Criar diretório de sessão se não existir
      if (!fs.existsSync(this.sessionPath)) {
        console.log(`📁 Criando diretório de sessão: ${this.sessionPath}`);
        fs.mkdirSync(this.sessionPath, { recursive: true });
      } else {
        // Se já existe e vamos fazer nova conexão, limpar arquivos corrompidos
        console.log(`🗑️  Limpando sessão antiga para instância ${this.instanceId}`);
        try {
          const files = fs.readdirSync(this.sessionPath);
          for (const file of files) {
            fs.unlinkSync(path.join(this.sessionPath, file));
          }
          console.log(`✅ ${files.length} arquivos de sessão removidos`);
        } catch (cleanError) {
          console.error('❌ Erro ao limpar sessão:', cleanError);
        }
      }

      // Autenticação multi-arquivo
      console.log(`🔐 Carregando autenticação multi-arquivo...`);
      const { state, saveCreds } = await useMultiFileAuthState(
        this.sessionPath
      );

      // Obter proxy rotativo do pool
      console.log(`🔄 Obtendo proxy rotativo do pool...`);
      this.currentProxy = proxyPool.getNextProxy();
      
      if (this.currentProxy) {
        console.log(`✅ Usando proxy: ${this.currentProxy.host}:${this.currentProxy.port} (${this.currentProxy.country || 'N/A'})`);
      } else {
        console.warn(`⚠️ Nenhum proxy disponível - Conectando sem proxy (risco de bloqueio)`);
      }

      // Criar socket com configurações otimizadas + proxy
      console.log(`🚀 Criando socket WhatsApp para instância ${this.instanceId}...`);
      const logger = pino({ level: 'silent' });
      
      const socketConfig: any = {
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger as any)
        },
        printQRInTerminal: true,  // Ajuda no debug
        logger: logger as any,
        browser: ['Chrome (Linux)', '', ''],
        markOnlineOnConnect: false,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        emitOwnEvents: false,
        fireInitQueries: false,
        generateHighQualityLinkPreview: false,
        linkPreviewImageThumbnailWidth: 192,
        transactionOpts: { maxCommitRetries: 1, delayBetweenTriesMs: 10 },
        getMessage: async (key: any) => {
          return { conversation: '' }
        },
      };

      // Adicionar proxy se disponível
      if (this.currentProxy) {
        socketConfig.agent = this.createProxyAgent(this.currentProxy);
        console.log(`🔐 Proxy configurado no socket`);
      }

      this.sock = makeWASocket(socketConfig);

      console.log(`✅ Socket criado com sucesso para instância ${this.instanceId}`);

      // Event: Atualização de conexão
      this.sock.ev.on('connection.update', async (update) => {
        console.log(`🔄 connection.update event para ${this.instanceId}:`, {
          connection: update.connection,
          lastDisconnect: update.lastDisconnect ? 'presente' : 'null',
          qr: update.qr ? 'QR CODE RECEBIDO!' : 'null',
        });
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
      console.log(`⏳ Status atualizado para 'connecting' - Aguardando QR Code...`);
    } catch (error) {
      console.error(`❌ Erro ao conectar instância ${this.instanceId}:`, error);
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
      console.log(`✅ QR Code gerado para instância ${this.instanceId}`);
      console.log(`   QR Code (primeiros 50 chars): ${qr.substring(0, 50)}...`);
      
      try {
        await this.updateQRCode(qr);
        console.log(`   ✅ QR Code salvo no banco de dados`);
        
        if (this.qrCodeCallback) {
          this.qrCodeCallback(qr);
          console.log(`   ✅ Callback de QR Code executado`);
        }
      } catch (qrError) {
        console.error(`   ❌ Erro ao processar QR Code:`, qrError);
      }
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
      this.sock = null;
      
      // Log detalhado do erro
      console.log(`❌ Conexão fechada para instância ${this.instanceId}`);
      if (lastDisconnect) {
        const statusCode = (lastDisconnect.error as Boom)?.output?.statusCode;
        console.log(`   Status Code: ${statusCode}`);
        console.log(`   Error: ${(lastDisconnect.error as Boom)?.message}`);
        console.log(`   Full error:`, JSON.stringify(lastDisconnect.error, null, 2));
        
        // Erros comuns e suas soluções
        if (statusCode === 401) {
          console.log(`   ⚠️  Erro 401: Sessão inválida ou expirada. Limpando sessão...`);
          await this.clearSession();
          await this.updateStatus('disconnected');
          return;
        }
        
        if (statusCode === 405) {
          console.log(`   ⚠️  Erro 405: WhatsApp bloqueou a conexão.`);
          console.log(`   ℹ️  Isso pode acontecer por:`);
          console.log(`      - Rate limiting (muitas tentativas)`);
          console.log(`      - Região/IP bloqueado temporariamente`);
          console.log(`      - Configuração do navegador detectada`);
          console.log(`   💡 Dica: Aguarde 1-2 minutos e tente novamente`);
          await this.clearSession(); // Limpar sessão corrompida
          await this.updateStatus('disconnected');
          // NÃO reconectar automaticamente no erro 405 - deixar o usuário tentar manualmente
          return;
        }
        
        if (statusCode === 408 || statusCode === 428) {
          console.log(`   ⚠️  Erro ${statusCode}: Timeout de conexão. Tentando novamente...`);
          await this.updateStatus('disconnected');
          setTimeout(() => {
            if (!this.sock && !this.isConnecting) {
              this.connect(
                this.qrCodeCallback,
                this.statusCallback,
                this.messageCallback
              );
            }
          }, 3000);
          return;
        }
      }
      
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
          if (!this.sock && !this.isConnecting) {
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
      console.log(`📸 Convertendo QR code para base64 (instância ${this.instanceId})...`);
      console.log(`   QR text length: ${qr.length} chars`);
      
      // Converter QR code texto para Data URL (imagem base64)
      const qrDataUrl = await QRCode.toDataURL(qr);
      console.log(`✅ QR Code convertido! Data URL length: ${qrDataUrl.length} chars`);
      
      await prisma.whatsAppInstance.update({
        where: { id: this.instanceId },
        data: { qrCode: qrDataUrl },
      });
      
      console.log(`💾 QR Code salvo no banco de dados para instância ${this.instanceId}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar QR code:`, error);
    }
  }

  /**
   * Cria agente proxy para Baileys
   */
  private createProxyAgent(proxy: ProxyConfig): any {
    try {
      const proxyUrl = proxy.url;
      console.log(`🔧 Criando proxy agent: ${proxyUrl}`);
      
      // Para proxies SOCKS5, usar SocksProxyAgent
      if (proxy.protocol === 'socks5') {
        const { SocksProxyAgent } = require('socks-proxy-agent');
        return new SocksProxyAgent(proxyUrl);
      }
      
      // Para HTTP/HTTPS, usar HttpsProxyAgent
      const { HttpsProxyAgent } = require('https-proxy-agent');
      return new HttpsProxyAgent(proxyUrl);
    } catch (error) {
      console.error('❌ Erro ao criar proxy agent:', error);
      return null;
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
