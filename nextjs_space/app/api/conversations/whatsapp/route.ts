
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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
    if (assignedTo) where.assigned_to = assignedTo;
    if (instanceId) where.instance_id = instanceId;

    // Conversas que precisam de tabulação (fechadas há mais de 2 horas sem tabulação)
    if (needsTabulation === 'true') {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      where.status = 'CLOSED';
      where.tabulated_at = null;
      where.closed_at = {
        lte: twoHoursAgo,
      };
    }

    const conversations = await prisma.whatsapp_conversations.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        whatsapp_conversation_messages: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1, // Última mensagem
        },
      },
      orderBy: {
        last_message_at: 'desc', // Mais antigas primeiro quando fechadas
      },
    });

    // Adicionar flag para conversas que precisam de alerta
    const conversationsWithAlert = conversations.map((conv) => {
      let needsAlert = false;
      if (
        conv.status === 'CLOSED' &&
        !conv.tabulated_at &&
        conv.closed_at
      ) {
        const hoursSinceClosed =
          (Date.now() - conv.closed_at.getTime()) / (1000 * 60 * 60);
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
        instance_id: instanceId,
        contact_phone: contactPhone,
        status: 'ACTIVE',
      },
    });

    if (existingConv) {
      return NextResponse.json(existingConv);
    }

    // Criar nova conversa
    const conversation = await prisma.whatsapp_conversations.create({
      data: {
        id: uuidv4(),
        instance_id: instanceId,
        contact_phone: contactPhone,
        contact_name: contactName,
        assigned_to: assignedTo,
        status: 'ACTIVE',
        last_message_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        users: {
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
