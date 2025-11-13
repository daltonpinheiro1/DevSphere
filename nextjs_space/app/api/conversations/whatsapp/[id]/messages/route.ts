
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
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
    const message = await prisma.whatsapp_conversation_messages.create({
      data: {
        id: uuidv4(),
        conversation_id: params.id,
        message_id: messageId,
        from_me: fromMe,
        content,
        message_type: messageType || 'text',
      },
    });

    // Atualizar lastMessageAt da conversa
    await prisma.whatsapp_conversations.update({
      where: { id: params.id },
      data: { last_message_at: new Date() },
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
