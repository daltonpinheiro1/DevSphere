
/**
 * Sistema de Pool de Proxies Rotativos
 * Gerencia múltiplos proxies com health check e rotação automática
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';
import http from 'http';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Oxylabs Credentials (Residential Proxies)
const OXYLABS_HOST = 'pr.oxylabs.io';
const OXYLABS_PORT = 7777;
const OXYLABS_USERNAME_BASE = 'customer-dspinheiro_7Wk3n';
const OXYLABS_PASSWORD = '7aKD+M4SqzZKxWK';

// Países disponíveis para rotação (priorizando América Latina)
const OXYLABS_COUNTRIES = [
  { code: 'BR', name: 'Brasil', priority: 1 },
  { code: 'US', name: 'Estados Unidos', priority: 2 },
  { code: 'MX', name: 'México', priority: 3 },
  { code: 'AR', name: 'Argentina', priority: 3 },
  { code: 'CO', name: 'Colômbia', priority: 3 },
  { code: 'CL', name: 'Chile', priority: 3 },
];

export interface ProxyConfig {
  id?: string;
  url: string; // formato: http://user:pass@host:port ou socks5://host:port
  protocol: 'http' | 'https' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  status: 'active' | 'inactive' | 'testing';
  lastChecked?: Date;
  responseTime?: number;
  successRate?: number;
}

class ProxyPool {
  private proxies: Map<string, ProxyConfig> = new Map();
  private currentIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private initialized = false;

  constructor() {
    // Não chama loadProxiesFromDB aqui pois é async
  }

  /**
   * Inicializa o pool carregando proxies do banco
   */
  async init() {
    if (this.initialized) return;
    await this.loadProxiesFromDB();
    this.initialized = true;
  }

  /**
   * Carrega proxies do banco de dados
   */
  async loadProxiesFromDB() {
    try {
      const dbProxies = await prisma.proxy_servers.findMany({
        // Carrega TODOS os proxies (ativos, inativos e em teste) para permitir testes
      });

      for (const proxy of dbProxies) {
        const config = this.parseProxyUrl(proxy.url);
        if (config) {
          config.id = proxy.id;
          config.country = proxy.country || undefined;
          config.status = proxy.status as 'active' | 'inactive' | 'testing';
          config.lastChecked = proxy.last_checked || undefined;
          config.responseTime = proxy.response_time || undefined;
          config.successRate = proxy.success_rate || undefined;
          
          this.proxies.set(proxy.id, config);
        }
      }

      console.log(`✅ [ProxyPool] Carregados ${this.proxies.size} proxies do banco`);
    } catch (error) {
      console.error('❌ [ProxyPool] Erro ao carregar proxies:', error);
    }
  }

  /**
   * Converte URL de proxy em configuração estruturada
   */
  parseProxyUrl(url: string): ProxyConfig | null {
    try {
      // Formato: protocol://[user:pass@]host:port
      const regex = /^(https?|socks5):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/;
      const match = url.match(regex);

      if (!match) {
        console.error(`❌ [ProxyPool] URL inválida: ${url}`);
        return null;
      }

      const [, protocol, username, password, host, port] = match;

      return {
        url,
        protocol: protocol as 'http' | 'https' | 'socks5',
        host,
        port: parseInt(port),
        username,
        password,
        status: 'testing'
      };
    } catch (error) {
      console.error(`❌ [ProxyPool] Erro ao parsear proxy: ${url}`, error);
      return null;
    }
  }

  /**
   * Adiciona proxy ao pool
   */
  async addProxy(proxyUrl: string, country?: string): Promise<ProxyConfig | null> {
    const config = this.parseProxyUrl(proxyUrl);
    if (!config) return null;

    try {
      // Salvar no banco
      const dbProxy = await prisma.proxy_servers.create({
        data: {
          url: proxyUrl,
          protocol: config.protocol,
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          country,
          status: 'testing'
        }
      });

      config.id = dbProxy.id;
      config.country = country;
      this.proxies.set(dbProxy.id, config);

      console.log(`✅ [ProxyPool] Proxy adicionado: ${config.host}:${config.port}`);

      // Health check imediato
      await this.checkProxyHealth(config);

      return config;
    } catch (error) {
      console.error('❌ [ProxyPool] Erro ao adicionar proxy:', error);
      return null;
    }
  }

  /**
   * Remove proxy do pool
   */
  async removeProxy(proxyId: string): Promise<boolean> {
    try {
      await prisma.proxy_servers.delete({
        where: { id: proxyId }
      });

      this.proxies.delete(proxyId);
      console.log(`✅ [ProxyPool] Proxy removido: ${proxyId}`);
      return true;
    } catch (error) {
      console.error('❌ [ProxyPool] Erro ao remover proxy:', error);
      return false;
    }
  }

  /**
   * Obtém próximo proxy disponível (rotação round-robin)
   * @param excludeProxyId - ID do proxy a ser excluído (usado em fallback)
   */
  async getNextProxy(excludeProxyId?: string): Promise<ProxyConfig | null> {
    await this.init(); // Garante que as proxies foram carregadas
    const activeProxies = Array.from(this.proxies.values())
      .filter(p => p.status === 'active' && p.id !== excludeProxyId) // Exclui proxy que falhou
      .sort((a, b) => (a.responseTime || 9999) - (b.responseTime || 9999));

    if (activeProxies.length === 0) {
      console.warn('⚠️ [ProxyPool] Nenhum proxy ativo disponível!');
      return null;
    }

    // Round-robin com fallback para o mais rápido
    const proxy = activeProxies[this.currentIndex % activeProxies.length];
    this.currentIndex++;

    console.log(`🔄 [ProxyPool] Usando proxy: ${proxy.host}:${proxy.port} (${proxy.country || 'N/A'})`);
    return proxy;
  }

  /**
   * Marca proxy como falho e reduz taxa de sucesso
   */
  async markProxyAsFailed(proxyId: string, reason: string = 'Conexão falhou'): Promise<void> {
    const proxy = this.proxies.get(proxyId);
    if (!proxy) {
      console.warn(`⚠️ [ProxyPool] Proxy ${proxyId} não encontrado para marcar como falho`);
      return;
    }

    console.log(`❌ [ProxyPool] Marcando proxy ${proxy.country} como falho: ${reason}`);

    // Reduz taxa de sucesso drasticamente
    const newSuccessRate = Math.max(0, (proxy.success_rate || 50) - 30);
    
    // Se taxa cair abaixo de 20%, marca como inativo
    const newStatus = newSuccessRate < 20 ? 'inactive' : 'active';

    try {
      await prisma.proxy_servers.update({
        where: { id: proxyId },
        data: {
          status: newStatus,
          successRate: newSuccessRate,
          lastChecked: new Date()
        }
      });

      // Atualiza cache local
      proxy.status = newStatus;
      proxy.success_rate = newSuccessRate;
      proxy.last_checked = new Date();

      console.log(`📊 [ProxyPool] Proxy ${proxy.country}: taxa de sucesso ${newSuccessRate}%, status: ${newStatus}`);
    } catch (error) {
      console.error(`❌ [ProxyPool] Erro ao atualizar status do proxy:`, error);
    }
  }

  /**
   * Marca proxy como bem-sucedido e aumenta taxa de sucesso
   */
  async markProxyAsSuccessful(proxyId: string): Promise<void> {
    const proxy = this.proxies.get(proxyId);
    if (!proxy) return;

    console.log(`✅ [ProxyPool] Proxy ${proxy.country} funcionou com sucesso`);

    // Aumenta taxa de sucesso
    const newSuccessRate = Math.min(100, (proxy.success_rate || 50) + 10);

    try {
      await prisma.proxy_servers.update({
        where: { id: proxyId },
        data: {
          status: 'active',
          successRate: newSuccessRate,
          lastChecked: new Date()
        }
      });

      // Atualiza cache local
      proxy.status = 'active';
      proxy.success_rate = newSuccessRate;
      proxy.last_checked = new Date();
    } catch (error) {
      console.error(`❌ [ProxyPool] Erro ao atualizar status do proxy:`, error);
    }
  }

  /**
   * Obtém proxy específico por ID
   */
  getProxyById(proxyId: string): ProxyConfig | null {
    return this.proxies.get(proxyId) || null;
  }

  /**
   * Lista todos os proxies
   */
  getAllProxies(): ProxyConfig[] {
    return Array.from(this.proxies.values());
  }

  /**
   * Testa todos os proxies e retorna estatísticas
   */
  async testAllProxies(): Promise<{ active: number; inactive: number; results: ProxyConfig[] }> {
    await this.init(); // Garante que as proxies foram carregadas
    const allProxies = this.getAllProxies();
    const results: ProxyConfig[] = [];
    let active = 0;
    let inactive = 0;

    console.log(`🧪 [ProxyPool] Testando ${allProxies.length} proxies...`);

    for (const proxy of allProxies) {
      const isHealthy = await this.checkProxyHealth(proxy);
      
      if (isHealthy) {
        active++;
      } else {
        inactive++;
      }

      results.push({
        ...proxy,
        status: isHealthy ? 'active' : 'inactive'
      });
    }

    console.log(`✅ [ProxyPool] Teste concluído: ${active} ativos, ${inactive} inativos`);

    return { active, inactive, results };
  }

  /**
   * Verifica saúde do proxy
   */
  async checkProxyHealth(proxy: ProxyConfig): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 [ProxyPool] Testando proxy: ${proxy.host}:${proxy.port}`);

      // Testa conexão via proxy
      const isHealthy = await this.testProxyConnection(proxy);
      const responseTime = Date.now() - startTime;

      // Atualiza status no banco
      await prisma.proxy_servers.update({
        where: { id: proxy.id },
        data: {
          status: isHealthy ? 'active' : 'inactive',
          lastChecked: new Date(),
          responseTime: isHealthy ? responseTime : null,
          successRate: isHealthy ? (proxy.success_rate || 0) + 10 : Math.max(0, (proxy.success_rate || 100) - 20)
        }
      });

      // Atualiza cache local
      proxy.status = isHealthy ? 'active' : 'inactive';
      proxy.last_checked = new Date();
      proxy.response_time = responseTime;

      console.log(`${isHealthy ? '✅' : '❌'} [ProxyPool] Proxy ${proxy.host}: ${isHealthy ? 'OK' : 'FALHOU'} (${responseTime}ms)`);

      return isHealthy;
    } catch (error) {
      console.error(`❌ [ProxyPool] Erro no health check de ${proxy.host}:`, error);
      
      // Marca como inativo
      if (proxy.id) {
        await prisma.proxy_servers.update({
          where: { id: proxy.id },
          data: { status: 'inactive', lastChecked: new Date() }
        });
      }

      proxy.status = 'inactive';
      return false;
    }
  }

  /**
   * Testa conexão do proxy
   */
  private testProxyConnection(proxy: ProxyConfig): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Constrói URL do proxy com autenticação
        const proxyUrl = proxy.username && proxy.password
          ? `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
          : `${proxy.protocol}://${proxy.host}:${proxy.port}`;

        // Cria agent apropriado para o protocolo
        const agent = proxy.protocol === 'https' 
          ? new HttpsProxyAgent(proxyUrl)
          : new HttpProxyAgent(proxyUrl);

        // Faz requisição através do proxy
        const options = {
          method: 'GET',
          agent,
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
          }
        };

        const req = https.request('https://www.google.com', options, (res) => {
          const success = res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302;
          console.log(`🔍 [ProxyTest] ${proxy.host}:${proxy.port} - Status: ${res.statusCode} - ${success ? 'OK' : 'FALHOU'}`);
          resolve(success);
        });

        req.on('error', (error) => {
          console.error(`❌ [ProxyTest] Erro ao testar ${proxy.host}:${proxy.port}:`, error.message);
          resolve(false);
        });

        req.on('timeout', () => {
          console.error(`⏱️ [ProxyTest] Timeout ao testar ${proxy.host}:${proxy.port}`);
          req.destroy();
          resolve(false);
        });

        req.end();
      } catch (error: any) {
        console.error(`❌ [ProxyTest] Exceção ao testar ${proxy.host}:${proxy.port}:`, error.message);
        resolve(false);
      }
    });
  }

  /**
   * Inicia health check periódico (a cada 5 minutos)
   */
  startHealthCheckLoop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    console.log('🔄 [ProxyPool] Iniciando health check automático...');

    this.healthCheckInterval = setInterval(async () => {
      console.log('🔍 [ProxyPool] Executando health check de todos os proxies...');
      
      for (const proxy of this.proxies.values()) {
        await this.checkProxyHealth(proxy);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay entre checks
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Para health check periódico
   */
  stopHealthCheckLoop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('⏹️ [ProxyPool] Health check automático parado');
    }
  }

  /**
   * Verifica se há proxies disponíveis (VALIDAÇÃO OBRIGATÓRIA)
   */
  async hasAvailableProxies(): Promise<boolean> {
    await this.init(); // Garante que as proxies foram carregadas
    const activeProxies = Array.from(this.proxies.values())
      .filter(p => p.status === 'active');
    
    const count = activeProxies.length;
    console.log(`📊 [ProxyPool] Proxies ativos disponíveis: ${count}`);
    
    if (count === 0) {
      console.error('❌ [ProxyPool] NENHUM PROXY ATIVO! Sistema não pode conectar sem proxy.');
    }
    
    return count > 0;
  }

  /**
   * Obtém estatísticas do pool de proxies
   */
  async getPoolStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    avgResponseTime: number;
    avgSuccessRate: number;
  }> {
    const allProxies = this.getAllProxies();
    
    const active = allProxies.filter(p => p.status === 'active').length;
    const inactive = allProxies.filter(p => p.status === 'inactive' || p.status === 'testing').length;
    
    const activeProxies = allProxies.filter(p => p.status === 'active');
    const avgResponseTime = activeProxies.reduce((sum, p) => sum + (p.responseTime || 0), 0) / (activeProxies.length || 1);
    const avgSuccessRate = activeProxies.reduce((sum, p) => sum + (p.successRate || 0), 0) / (activeProxies.length || 1);

    return {
      total: allProxies.length,
      active,
      inactive,
      avgResponseTime: Math.round(avgResponseTime),
      avgSuccessRate: Math.round(avgSuccessRate * 10) / 10,
    };
  }

  /**
   * Obtém melhor proxy disponível (exclui proxies específicos)
   */
  async getBestProxy(excludeIds: string[] = []): Promise<ProxyConfig | null> {
    await this.init(); // Garante que as proxies foram carregadas
    const activeProxies = Array.from(this.proxies.values())
      .filter(p => p.status === 'active' && !excludeIds.includes(p.id || ''))
      .sort((a, b) => {
        // Score baseado em taxa de sucesso e tempo de resposta
        const scoreA = (a.successRate || 0) * 100 - (a.responseTime || 9999);
        const scoreB = (b.successRate || 0) * 100 - (b.responseTime || 9999);
        return scoreB - scoreA; // Ordem decrescente (melhor primeiro)
      });

    if (activeProxies.length === 0) {
      console.error('❌ [ProxyPool] Nenhum proxy disponível para seleção!');
      return null;
    }

    const bestProxy = activeProxies[0];
    console.log(`🏆 [ProxyPool] Melhor proxy: ${bestProxy.country} (${Math.round((bestProxy.successRate || 0))}% sucesso, ${bestProxy.responseTime}ms)`);
    
    return bestProxy;
  }

  /**
   * Converte configuração de proxy para formato Baileys
   */
  toBalieysProxyConfig(proxy: ProxyConfig) {
    return {
      host: proxy.host,
      port: proxy.port,
      protocol: proxy.protocol,
      username: proxy.username,
      password: proxy.password
    };
  }
}

/**
 * Função helper para adicionar proxies do Oxylabs automaticamente
 */
export async function setupOxylabsProxies() {
  console.log('🌐 Configurando proxies do Oxylabs...');
  
  const results = {
    added: 0,
    existing: 0,
    failed: 0,
  };

  for (const country of OXYLABS_COUNTRIES) {
    try {
      // Formato Oxylabs: customer-username-cc-COUNTRY
      const username = `${OXYLABS_USERNAME_BASE}-cc-${country.code}`;
      const proxyUrl = `http://${username}:${OXYLABS_PASSWORD}@${OXYLABS_HOST}:${OXYLABS_PORT}`;

      // Verificar se já existe
      const existing = await prisma.proxy_servers.findFirst({
        where: {
          url: proxyUrl
        }
      });

      if (existing) {
        console.log(`  ✓ Proxy ${country.name} (${country.code}) já existe`);
        results.existing++;
        continue;
      }

      // Adicionar proxy ao banco
      await prisma.proxy_servers.create({
        data: {
          url: proxyUrl,
          protocol: 'http',
          host: OXYLABS_HOST,
          port: OXYLABS_PORT,
          username: username,
          password: OXYLABS_PASSWORD,
          country: country.name,
          status: 'testing',
          responseTime: 0,
          successRate: 100,
          totalUses: 0,
          totalFailures: 0,
        }
      });

      console.log(`  ✅ Proxy ${country.name} (${country.code}) adicionado`);
      results.added++;
    } catch (error) {
      console.error(`  ❌ Erro ao adicionar proxy ${country.name}:`, error);
      results.failed++;
    }
  }

  console.log(`\n📊 Resultado: ${results.added} adicionados, ${results.existing} já existiam, ${results.failed} falharam\n`);

  // Recarregar proxies no pool
  await proxyPool.loadProxiesFromDB();
  
  // Testar todos os proxies
  if (results.added > 0) {
    console.log('🧪 Testando proxies adicionados...');
    const testResults = await proxyPool.testAllProxies();
    console.log(`✅ Teste concluído: ${testResults.active} ativos, ${testResults.inactive} inativos\n`);
  }

  return results;
}

// Singleton instance
export const proxyPool = new ProxyPool();

// Iniciar health check automático
proxyPool.startHealthCheckLoop();

// Configurar proxies do Oxylabs automaticamente na inicialização
setupOxylabsProxies().catch(err => {
  console.error('❌ Erro ao configurar proxies do Oxylabs:', err);
});
