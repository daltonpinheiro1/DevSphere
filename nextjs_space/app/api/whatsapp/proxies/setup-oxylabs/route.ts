
import { NextRequest, NextResponse } from 'next/server';
import { setupOxylabsProxies } from '@/lib/whatsapp/proxy-pool';

/**
 * POST /api/whatsapp/proxies/setup-oxylabs
 * Configura proxies do Oxylabs automaticamente
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📡 API: Iniciando configuração de proxies Oxylabs...');
    
    const results = await setupOxylabsProxies();
    
    return NextResponse.json({
      success: true,
      message: 'Proxies Oxylabs configurados com sucesso',
      results
    });
  } catch (error: any) {
    console.error('❌ Erro ao configurar proxies Oxylabs:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erro ao configurar proxies'
      },
      { status: 500 }
    );
  }
}
