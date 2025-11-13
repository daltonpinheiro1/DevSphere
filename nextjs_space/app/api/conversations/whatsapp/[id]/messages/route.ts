
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/conversations/whatsapp/[id]/messages
 * Adiciona mensagem à conversa
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { messageId, fromMe, content, messageType } = body;

    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'MessageId e content são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar mensagem
    const message = await prisma.whatsAppConversationMessage.create({
      data: {
        conversationId: params.id,
        messageId,
        fromMe,
        content,
        messageType: messageType || 'text',
        timestamp: new Date(),
      },
    });

    // Atualizar lastMessageAt da conversa
    await prisma.whatsAppConversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar mensagem' },
      { status: 500 }
    );
  }
}
