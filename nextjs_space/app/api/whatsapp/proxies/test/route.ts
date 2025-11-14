
/**
 * API para testar todos os proxies do pool
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyPool } from '@/lib/whatsapp/proxy-pool';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Iniciando teste de todos os proxies...');
    
    const proxies = proxyPool.getAllProxies();
    const results = [];

    for (const proxy of proxies) {
      const isHealthy = await proxyPool.checkProxyHealth(proxy);
      results.push({
        id: proxy.id,
        host: proxy.host,
        port: proxy.port,
        country: proxy.country,
        status: proxy.status,
        response_time: proxy.responseTime || 0,
        isHealthy
      });
    }

    const activeCount = results.filter(r => r.status === 'active').length;
    const inactiveCount = results.filter(r => r.status === 'inactive').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        active: activeCount,
        inactive: inactiveCount,
        avgResponseTime: results
          .filter(r => r.response_time)
          .reduce((acc, r) => acc + (r.response_time || 0), 0) / activeCount || 0
      },
      results
    });
  } catch (error: any) {
    console.error('Erro ao testar proxies:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
