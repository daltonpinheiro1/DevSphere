
/**
 * Script para configurar proxies do Oxylabs
 * Uso: npx tsx scripts/setup-oxylabs.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Oxylabs Credentials
const OXYLABS_HOST = 'pr.oxylabs.io';
const OXYLABS_PORT = 7777;
const OXYLABS_USERNAME_BASE = 'customer-dspinheiro_7Wk3n';
const OXYLABS_PASSWORD = '7aKD+M4SqzZKxWK';

// Países disponíveis para rotação
const OXYLABS_COUNTRIES = [
  { code: 'BR', name: 'Brasil', priority: 1 },
  { code: 'US', name: 'Estados Unidos', priority: 2 },
  { code: 'MX', name: 'México', priority: 3 },
  { code: 'AR', name: 'Argentina', priority: 3 },
  { code: 'CO', name: 'Colômbia', priority: 3 },
  { code: 'CL', name: 'Chile', priority: 3 },
];

async function setupProxies() {
  console.log('🌐 Configurando proxies do Oxylabs...\n');
  
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

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ ${results.added} adicionados`);
  console.log(`   ✓  ${results.existing} já existiam`);
  console.log(`   ❌ ${results.failed} falharam\n`);

  return results;
}

// Executar script
setupProxies()
  .then(() => {
    console.log('✅ Setup concluído com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no setup:', error);
    process.exit(1);
  });
