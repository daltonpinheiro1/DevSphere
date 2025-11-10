import 'dotenv/config';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Credenciais Oxylabs
const OXYLABS_HOST = 'pr.oxylabs.io';
const OXYLABS_PORT = 7777;
const OXYLABS_USERNAME_BASE = 'customer-dspinheiro_7Wk3n';
const OXYLABS_PASSWORD = '7aKD+M4SqzZKxWK';

async function testProxy(country: string) {
  return new Promise((resolve) => {
    const username = `${OXYLABS_USERNAME_BASE}-cc-${country}`;
    const proxyUrl = `http://${username}:${OXYLABS_PASSWORD}@${OXYLABS_HOST}:${OXYLABS_PORT}`;
    
    console.log(`\n🔍 Testando proxy ${country}: ${OXYLABS_HOST}:${OXYLABS_PORT}`);
    console.log(`   Username: ${username}`);
    
    const agent = new HttpsProxyAgent(proxyUrl);
    
    const options = {
      method: 'GET',
      agent,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    };

    const startTime = Date.now();
    const req = https.request('https://www.google.com', options, (res) => {
      const responseTime = Date.now() - startTime;
      console.log(`✅ Proxy ${country} OK - Status: ${res.statusCode} - Tempo: ${responseTime}ms`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.error(`❌ Proxy ${country} FALHOU:`, error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error(`⏱️ Proxy ${country} TIMEOUT`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 Testando proxies Oxylabs...\n');
  
  const countries = ['br', 'us', 'mx', 'ar', 'co', 'cl'];
  
  for (const country of countries) {
    await testProxy(country);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Teste concluído!');
}

main().catch(console.error);
