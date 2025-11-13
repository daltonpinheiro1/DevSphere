
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/conversations/whatsapp/[id]
 * Busca conversa por ID com mensagens
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await prisma.whatsapp_conversations.findUnique({
      where: { id: params.id },
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
            timestamp: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Erro ao buscar conversa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conversa' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/conversations/whatsapp/[id]
 * Atualiza conversa (status, tabulação, etc)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      status,
      assignedTo,
      tabulationReason,
      saleType,
      salePlanName,
      notes,
    } = body;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'CLOSED') {
        updateData.closedAt = new Date();
      }
      if (status === 'REOPENED') {
        updateData.closedAt = null;
        updateData.tabulatedAt = null;
      }
    }
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (tabulationReason) {
      updateData.tabulationReason = tabulationReason;
      updateData.tabulatedAt = new Date();
    }
    if (saleType !== undefined) updateData.saleType = saleType;
    if (salePlanName !== undefined) updateData.salePlanName = salePlanName;
    if (notes !== undefined) updateData.notes = notes;

    const conversation = await prisma.whatsapp_conversations.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conversa' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/whatsapp/[id]
 * Remove conversa
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.whatsapp_conversations.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar conversa:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar conversa' },
      { status: 500 }
    );
  }
}
