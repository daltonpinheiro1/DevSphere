
/**
 * API para gerenciar proxy específico
 * GET - Buscar proxy por ID
 * DELETE - Remover proxy
 * PATCH - Executar health check manual
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyPool } from '@/lib/whatsapp/proxy-pool';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proxy = await prisma.proxyServer.findUnique({
      where: { id: params.id }
    });

    if (!proxy) {
      return NextResponse.json(
        { success: false, error: 'Proxy não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      proxy: {
        ...proxy,
        url: proxy.url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
        password: proxy.password ? '***' : null
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar proxy:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await proxyPool.removeProxy(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Falha ao remover proxy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Proxy removido com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao remover proxy:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proxy = proxyPool.getProxyById(params.id);

    if (!proxy) {
      return NextResponse.json(
        { success: false, error: 'Proxy não encontrado' },
        { status: 404 }
      );
    }

    console.log(`🔍 Executando health check manual do proxy ${params.id}...`);
    const isHealthy = await proxyPool.checkProxyHealth(proxy);

    return NextResponse.json({
      success: true,
      isHealthy,
      proxy: {
        ...proxy,
        url: proxy.url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
        password: proxy.password ? '***' : null
      }
    });
  } catch (error: any) {
    console.error('Erro ao testar proxy:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
