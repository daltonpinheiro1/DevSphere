import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const proxies = await prisma.proxyServer.findMany();
    console.log(`\n✅ Total de proxies: ${proxies.length}\n`);
    
    if (proxies.length === 0) {
      console.log('❌ PROBLEMA: Não há proxies configurados!');
      console.log('   O sistema exige proxy obrigatório para conectar.');
    } else {
      proxies.forEach((p: any, i: number) => {
        console.log(`${i+1}. ${p.country} - ${p.protocol}://${p.host}:${p.port}`);
        console.log(`   Status: ${p.status}, SuccessRate: ${p.successRate || 0}%\n`);
      });
    }
  } catch (error: any) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
