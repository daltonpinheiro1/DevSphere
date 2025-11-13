
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
import { v4 as uuidv4 } from 'uuid';

export class WhatsAppInstanceManager {
  private sock: WASocket | null = null;
  private instance_id: string;
  private sessionPath: string;
  private qrCodeCallback?: (qr: string) => void;
  private statusCallback?: (status: string) => void;
  private messageCallback?: (message: any) => void;
  private isConnecting = false;
  private currentProxy: ProxyConfig | null = null;

  constructor(instanceId: string) {
    this.instance_id = instanceId;
    this.sessionPath = path.join(
      process.cwd(),
      'whatsapp_sessions',
      instanceId
    );
  }

  /**
   * Inicializa a conexão com WhatsApp com retry automático
   */
  async connect(
    onQrCode?: (qr: string) => void,
    onStatus?: (status: string) => void,
    onMessage?: (message: any) => void
  ): Promise<void> {
    if (this.isConnecting || this.sock) {
      console.log(`Instância ${this.instance_id} já está conectando/conectada`);
      return;
    }

    this.qrCodeCallback = onQrCode;
    this.statusCallback = onStatus;
    this.messageCallback = onMessage;

    // ✅ VALIDAÇÃO OBRIGATÓRIA: Verificar se há proxies disponíveis ANTES de tentar
    console.log(`\n🔍 [Validação] Verificando disponibilidade de proxies...`);
    const hasProxies = await proxyPool.hasAvailableProxies();
    
    if (!hasProxies) {
      const errorMsg = '❌ NENHUM PROXY ATIVO DISPONÍVEL! Não é possível conectar ao WhatsApp sem proxy (risco de bloqueio de IP). Configure proxies primeiro.';
      console.error(errorMsg);
      this.isConnecting = false;
      await this.updateStatus('error');
      throw new Error(errorMsg);
    }

    // Obter estatísticas do pool
    const stats = await proxyPool.getPoolStats();
    console.log(`📊 [Pool Stats] ${stats.active} proxies ativos, ${stats.inactive} inativos, latência média: ${stats.avgResponseTime}ms`);

    // Tentar até 3 vezes com proxies diferentes
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    const usedProxyIds: string[] = []; // Rastrear proxies já tentados
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`\n🔌 [Tentativa ${attempt}/${MAX_RETRIES}] Iniciando conexão da instância ${this.instance_id}...`);
        await this.connectWithProxy(attempt, usedProxyIds);
        
        // Se chegou aqui, conexão foi bem-sucedida
        if (this.currentProxy?.id) {
          await proxyPool.markProxyAsSuccessful(this.currentProxy.id);
          console.log(`✅ [Sucesso] Conexão estabelecida com proxy ${this.currentProxy.country} na tentativa ${attempt}`);
        }
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ [Tentativa ${attempt}/${MAX_RETRIES}] Falhou:`, error.message);

        // Se o proxy falhou, marcar como falho e adicionar à lista de usados
        if (this.currentProxy?.id) {
          await proxyPool.markProxyAsFailed(this.currentProxy.id, error.message);
          usedProxyIds.push(this.currentProxy.id);
          console.log(`📝 [Retry] Proxy ${this.currentProxy.country} marcado como falho. Total de proxies tentados: ${usedProxyIds.length}`);
        }

        // Verificar se ainda há proxies disponíveis para a próxima tentativa
        if (attempt < MAX_RETRIES) {
          const remainingProxies = await proxyPool.hasAvailableProxies();
          if (!remainingProxies) {
            console.error(`❌ [Erro Crítico] Nenhum proxy disponível para retry. Abortando...`);
            break;
          }

          console.log(`⏳ Aguardando 5s antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Limpar sessão corrompida
          await this.clearSession();
          console.log(`🗑️  Sessão corrompida limpa. Preparando nova tentativa com outro proxy...`);
        }
      }
    }

    // Se todas as tentativas falharam
    this.isConnecting = false;
    await this.updateStatus('error');
    console.error(`\n❌ Todas as ${MAX_RETRIES} tentativas falharam. Proxies testados: ${usedProxyIds.length}`);
    console.error(`   Último erro:`, lastError?.message);
    throw new Error(`Falha ao conectar após ${MAX_RETRIES} tentativas com ${usedProxyIds.length} proxies diferentes. Verifique os logs para mais detalhes.`);
  }

  /**
   * Conecta com um proxy específico
   */
  private async connectWithProxy(attempt: number, excludeProxyIds: string[] = []): Promise<void> {
    this.isConnecting = true;

    try {
      // Aguardar um pouco antes de conectar (evitar rate limiting)
      if (attempt > 1) {
        console.log(`⏳ Aguardando 3s antes de iniciar conexão...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Limpar QR code antigo no banco de dados
      console.log(`🧹 Limpando QR code antigo da instância ${this.instance_id}...`);
      await prisma.whatsAppInstance.update({
        where: { id: this.instance_id },
        data: { qrCode: null },
      });

      // Criar diretório de sessão se não existir
      if (!fs.existsSync(this.sessionPath)) {
        console.log(`📁 Criando diretório de sessão: ${this.sessionPath}`);
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      // Autenticação multi-arquivo
      console.log(`🔐 Carregando autenticação multi-arquivo...`);
      const { state, saveCreds } = await useMultiFileAuthState(
        this.sessionPath
      );

      // ✅ SELEÇÃO INTELIGENTE DE PROXY (excluindo os que falharam)
      console.log(`🔄 Selecionando melhor proxy disponível...`);
      if (excludeProxyIds.length > 0) {
        console.log(`   Excluindo ${excludeProxyIds.length} proxies que falharam anteriormente`);
      }
      
      this.currentProxy = await proxyPool.getBestProxy(excludeProxyIds);
      
      if (!this.currentProxy) {
        const errorMsg = `❌ FALHA CRÍTICA: Nenhum proxy disponível para tentativa ${attempt}. Configure mais proxies ou aguarde a recuperação dos existentes.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`✅ Proxy selecionado: ${this.currentProxy.country}`);
      console.log(`   Host: ${this.currentProxy.host}:${this.currentProxy.port}`);
      console.log(`   Performance: ${Math.round((this.currentProxy.successRate || 0))}% sucesso, ${this.currentProxy.responseTime || 'N/A'}ms latência`);

      // Criar socket com configurações otimizadas + proxy
      console.log(`🚀 Criando socket WhatsApp para instância ${this.instance_id}...`);
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

      // ✅ PROXY OBRIGATÓRIO: Adicionar agent do proxy ao socket
      socketConfig.agent = this.createProxyAgent(this.currentProxy);
      console.log(`🔐 Proxy ${this.currentProxy.country} configurado no socket WhatsApp`);

      this.sock = makeWASocket(socketConfig);

      console.log(`✅ Socket criado com sucesso para instância ${this.instance_id}`);

      // Event: Atualização de conexão
      this.sock.ev.on('connection.update', async (update) => {
        console.log(`🔄 connection.update event para ${this.instance_id}:`, {
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
      console.error(`❌ Erro ao conectar instância ${this.instance_id}:`, error);
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
      console.log(`✅ QR Code gerado para instância ${this.instance_id}`);
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
      console.log(`Instância ${this.instance_id} conectada com sucesso!`);
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
      console.log(`❌ Conexão fechada para instância ${this.instance_id}`);
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
          
          // Lançar erro para trigger retry automático
          throw new Error('Erro 401: Sessão inválida ou expirada');
        }
        
        if (statusCode === 405) {
          console.log(`   ⚠️  Erro 405: WhatsApp bloqueou a conexão (proxy ou IP banido).`);
          console.log(`   ℹ️  Isso pode acontecer por:`);
          console.log(`      - Proxy bloqueado pelo WhatsApp`);
          console.log(`      - Rate limiting (muitas tentativas)`);
          console.log(`      - IP residencial suspeito`);
          console.log(`   🔄 Sistema vai tentar com outro proxy automaticamente...`);
          await this.clearSession(); // Limpar sessão corrompida
          await this.updateStatus('disconnected');
          
          // Lançar erro para trigger retry automático com outro proxy
          throw new Error('Erro 405: IP/Proxy bloqueado pelo WhatsApp');
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
        `Conexão fechada para instância ${this.instance_id}. Reconectar?`,
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
        `Mensagem recebida na instância ${this.instance_id}: ${messageContent}`
      );

      // Salvar mensagem no banco
      await prisma.whatsAppMessage.create({
        data: {
          instance_id: this.instance_id,
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
          instance_id: this.instance_id,
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
        where: { id: this.instance_id },
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
          instance_id: this.instance_id,
          remoteJid: jid,
          message_id: `sent-${Date.now()}`,
          fromMe: true,
          content: message,
          messageType: mediaUrl ? 'image' : 'text',
          status: 'sent',
        },
      });

      // Incrementar contador de mensagens
      await prisma.whatsAppInstance.update({
        where: { id: this.instance_id },
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
        where: { id: this.instance_id },
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
      console.error(`Erro ao desconectar instância ${this.instance_id}:`, error);
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
        where: { id: this.instance_id },
        data: {
          qrCode: null,
          sessionData: null,
          phone_number: null,
        },
      });
    } catch (error) {
      console.error(`Erro ao limpar sessão ${this.instance_id}:`, error);
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
        data.phone_number = phoneNumber;
        data.lastConnectedAt = new Date();
      }

      await prisma.whatsAppInstance.update({
        where: { id: this.instance_id },
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
      console.log(`📸 Convertendo QR code para base64 (instância ${this.instance_id})...`);
      console.log(`   QR text length: ${qr.length} chars`);
      
      // Converter QR code texto para Data URL (imagem base64)
      const qrDataUrl = await QRCode.toDataURL(qr);
      console.log(`✅ QR Code convertido! Data URL length: ${qrDataUrl.length} chars`);
      
      await prisma.whatsAppInstance.update({
        where: { id: this.instance_id },
        data: { qrCode: qrDataUrl },
      });
      
      console.log(`💾 QR Code salvo no banco de dados para instância ${this.instance_id}`);
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
