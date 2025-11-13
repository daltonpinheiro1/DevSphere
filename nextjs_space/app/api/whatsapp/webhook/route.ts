
import { NextRequest, NextResponse } from 'next/server';
import { autoReplyHandler } from '@/lib/whatsapp/auto-reply-handler';

/**
 * POST /api/whatsapp/webhook
 * Webhook para receber notificações de mensagens
 * (Pode ser usado por integrações externas se necessário)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, from, message, messageId, timestamp } = body;

    if (!instanceId || !from || !message) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Processar mensagem com auto-reply
    await autoReplyHandler.handleMessage({
      instanceId,
      from,
      message,
      message_id: messageId || `webhook-${Date.now()}`,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}
