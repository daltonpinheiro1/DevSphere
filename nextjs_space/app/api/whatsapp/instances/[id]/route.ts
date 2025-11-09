
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

    return NextResponse.json({
      success: true,
      instance: {
        ...instance,
        isConnectedNow: baileysService.isInstanceConnected(params.id),
      },
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
    const { name, companyName, messagesPerBatch, proxyUrl, autoReply, isActive, status } = body;

    const updated = await baileysService.updateInstanceConfig(
      params.id,
      {
        name,
        companyName,
        messagesPerBatch,
        proxyUrl,
        autoReply,
        isActive,
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
