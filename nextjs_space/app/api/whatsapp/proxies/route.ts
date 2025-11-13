
/**
 * API de gerenciamento de proxies
 * POST - Adicionar novo proxy
 * GET - Listar todos os proxies
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyPool } from '@/lib/whatsapp/proxy-pool';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const proxies = await prisma.proxy_servers.findMany({
      orderBy: [
        { status: 'asc' },
        { responseTime: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      proxies: proxies.map(p => ({
        ...p,
        // Mascarar credenciais sensíveis
        url: p.url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
        password: p.password ? '***' : null
      }))
    });
  } catch (error: any) {
    console.error('Erro ao listar proxies:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, country } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL do proxy é obrigatória' },
        { status: 400 }
      );
    }

    // Validar formato da URL
    const regex = /^(https?|socks5):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/;
    if (!regex.test(url)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Formato inválido. Use: protocol://[user:pass@]host:port (ex: http://user:pass@proxy.com:8080)' 
        },
        { status: 400 }
      );
    }

    const proxy = await proxyPool.addProxy(url, country);

    if (!proxy) {
      return NextResponse.json(
        { success: false, error: 'Falha ao adicionar proxy' },
        { status: 500 }
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
    console.error('Erro ao adicionar proxy:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
