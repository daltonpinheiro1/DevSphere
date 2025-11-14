
import { NextRequest, NextResponse } from 'next/server';
import { baileysService } from '@/lib/whatsapp/baileys-service';

/**
 * GET /api/whatsapp/instances/[id]
 * Obtém detalhes de uma instância
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instance = await baileysService.getInstance(params.id);

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instância não encontrada' },
        { status: 404 }
      );
    }

    // Converter snake_case para camelCase para o frontend
    const instanceData = {
      ...instance,
      qrCode: instance.qr_code,  // Converter qr_code para qrCode
      phoneNumber: instance.phone_number,  // Converter phone_number para phoneNumber
      companyName: instance.company_name,  // Converter company_name para companyName
      chatbotId: instance.chatbot_id,  // Converter chatbot_id para chatbotId
      autoReply: instance.auto_reply,  // Converter auto_reply para autoReply
      isActive: instance.is_active,  // Converter is_active para isActive
      messagesPerBatch: instance.messages_per_batch,  // Converter messages_per_batch para messagesPerBatch
      currentMessageCount: instance.current_message_count,  // Converter current_message_count para currentMessageCount
      proxyUrl: instance.proxy_url,  // Converter proxy_url para proxyUrl
      lastDnsRotation: instance.last_dns_rotation,  // Converter last_dns_rotation para lastDnsRotation
      createdAt: instance.created_at,  // Converter created_at para createdAt
      updatedAt: instance.updated_at,  // Converter updated_at para updatedAt
      isConnectedNow: baileysService.isInstanceConnected(params.id),
    };

    return NextResponse.json({
      success: true,
      instance: instanceData,
    });
  } catch (error) {
    console.error('Erro ao buscar instância:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar instância' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/whatsapp/instances/[id]
 * Atualiza configurações de uma instância
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, companyName, messagesPerBatch, proxyUrl, autoReply, is_active, status } = body;

    const updated = await baileysService.updateInstanceConfig(
      params.id,
      {
        name,
        companyName,
        messagesPerBatch,
        proxyUrl,
        autoReply,
        is_active,
        status,
      }
    );

    return NextResponse.json({
      success: true,
      instance: updated,
      message: 'Configurações atualizadas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar instância:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/instances/[id]
 * Exclui uma instância
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await baileysService.deleteInstance(params.id);

    return NextResponse.json({
      success: true,
      message: 'Instância excluída com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir instância:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir instância' },
      { status: 500 }
    );
  }
}
