
/**
 * Sistema de Pool de Proxies Rotativos
 * Gerencia múltiplos proxies com health check e rotação automática
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';
import http from 'http';

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

  constructor() {
    this.loadProxiesFromDB();
  }

  /**
   * Carrega proxies do banco de dados
   */
  async loadProxiesFromDB() {
    try {
      const dbProxies = await prisma.proxyServer.findMany({
        where: { 
          status: {
            in: ['active', 'testing']  // Carregar proxies ativos e em teste
          }
        }
      });

      for (const proxy of dbProxies) {
        const config = this.parseProxyUrl(proxy.url);
        if (config) {
          config.id = proxy.id;
          config.country = proxy.country || undefined;
          config.status = proxy.status as 'active' | 'inactive' | 'testing';
          config.lastChecked = proxy.lastChecked || undefined;
          config.responseTime = proxy.responseTime || undefined;
          config.successRate = proxy.successRate || undefined;
          
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
      const dbProxy = await prisma.proxyServer.create({
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
      await prisma.proxyServer.delete({
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
  getNextProxy(excludeProxyId?: string): ProxyConfig | null {
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
    const newSuccessRate = Math.max(0, (proxy.successRate || 50) - 30);
    
    // Se taxa cair abaixo de 20%, marca como inativo
    const newStatus = newSuccessRate < 20 ? 'inactive' : 'active';

    try {
      await prisma.proxyServer.update({
        where: { id: proxyId },
        data: {
          status: newStatus,
          successRate: newSuccessRate,
          lastChecked: new Date()
        }
      });

      // Atualiza cache local
      proxy.status = newStatus;
      proxy.successRate = newSuccessRate;
      proxy.lastChecked = new Date();

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
    const newSuccessRate = Math.min(100, (proxy.successRate || 50) + 10);

    try {
      await prisma.proxyServer.update({
        where: { id: proxyId },
        data: {
          status: 'active',
          successRate: newSuccessRate,
          lastChecked: new Date()
        }
      });

      // Atualiza cache local
      proxy.status = 'active';
      proxy.successRate = newSuccessRate;
      proxy.lastChecked = new Date();
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
      await prisma.proxyServer.update({
        where: { id: proxy.id },
        data: {
          status: isHealthy ? 'active' : 'inactive',
          lastChecked: new Date(),
          responseTime: isHealthy ? responseTime : null,
          successRate: isHealthy ? (proxy.successRate || 0) + 10 : Math.max(0, (proxy.successRate || 100) - 20)
        }
      });

      // Atualiza cache local
      proxy.status = isHealthy ? 'active' : 'inactive';
      proxy.lastChecked = new Date();
      proxy.responseTime = responseTime;

      console.log(`${isHealthy ? '✅' : '❌'} [ProxyPool] Proxy ${proxy.host}: ${isHealthy ? 'OK' : 'FALHOU'} (${responseTime}ms)`);

      return isHealthy;
    } catch (error) {
      console.error(`❌ [ProxyPool] Erro no health check de ${proxy.host}:`, error);
      
      // Marca como inativo
      if (proxy.id) {
        await prisma.proxyServer.update({
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
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      };

      // Adiciona autenticação se necessário
      if (proxy.username && proxy.password) {
        const auth = Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64');
        headers['Proxy-Authorization'] = `Basic ${auth}`;
      }

      const options = {
        method: 'GET',
        host: proxy.host,
        port: proxy.port,
        path: 'https://www.google.com',
        timeout: 10000,
        headers
      };

      const client = proxy.protocol === 'https' ? https : http;
      const req = client.request(options, (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
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
      const existing = await prisma.proxyServer.findFirst({
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
      await prisma.proxyServer.create({
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
