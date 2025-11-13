
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/conversations/whatsapp
 * Lista conversas do WhatsApp com filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const instanceId = searchParams.get('instanceId');
    const needsTabulation = searchParams.get('needsTabulation');

    const where: any = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (instanceId) where.instanceId = instanceId;

    // Conversas que precisam de tabulação (fechadas há mais de 2 horas sem tabulação)
    if (needsTabulation === 'true') {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      where.status = 'CLOSED';
      where.tabulatedAt = null;
      where.closedAt = {
        lte: twoHoursAgo,
      };
    }

    const conversations = await prisma.whatsapp_conversations.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1, // Última mensagem
        },
      },
      orderBy: {
        lastMessageAt: 'desc', // Mais antigas primeiro quando fechadas
      },
    });

    // Adicionar flag para conversas que precisam de alerta
    const conversationsWithAlert = conversations.map((conv) => {
      let needsAlert = false;
      if (
        conv.status === 'CLOSED' &&
        !conv.tabulatedAt &&
        conv.closedAt
      ) {
        const hoursSinceClosed =
          (Date.now() - conv.closedAt.getTime()) / (1000 * 60 * 60);
        needsAlert = hoursSinceClosed >= 2;
      }
      return {
        ...conv,
        needsAlert,
      };
    });

    return NextResponse.json(conversationsWithAlert);
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar conversas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/whatsapp
 * Cria nova conversa do WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, contactPhone, contactName, assignedTo } = body;

    if (!instanceId || !contactPhone) {
      return NextResponse.json(
        { error: 'InstanceId e contactPhone são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe conversa ativa
    const existingConv = await prisma.whatsapp_conversations.findFirst({
      where: {
        instanceId,
        contactPhone,
        status: 'ACTIVE',
      },
    });

    if (existingConv) {
      return NextResponse.json(existingConv);
    }

    // Criar nova conversa
    const conversation = await prisma.whatsapp_conversations.create({
      data: {
        instanceId,
        contactPhone,
        contactName,
        assignedTo,
        status: 'ACTIVE',
        lastMessageAt: new Date(),
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conversa' },
      { status: 500 }
    );
  }
}
