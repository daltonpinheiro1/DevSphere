
import { NextRequest, NextResponse } from 'next/server';
import { baileysService } from '@/lib/whatsapp/baileys-service';

/**
 * GET /api/whatsapp/instances
 * Lista todas as instâncias
 */
export async function GET() {
  try {
    const instances = await baileysService.getAllInstances();

    // Adicionar status de conexão em tempo real
    const instancesWithStatus = instances.map((instance) => ({
      ...instance,
      isConnectedNow: baileysService.isInstanceConnected(instance.id),
    }));

    return NextResponse.json({
      success: true,
      instances: instancesWithStatus,
    });
  } catch (error) {
    console.error('Erro ao listar instâncias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar instâncias' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/instances
 * Cria uma nova instância
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company_id, companyName, chatbotId, messagesPerBatch, proxyUrl } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const instanceId = await baileysService.createInstance(
      name,
      company_id,
      chatbotId,
      messagesPerBatch,
      proxyUrl,
      companyName
    );

    const instance = await baileysService.getInstance(instanceId);

    return NextResponse.json({
      success: true,
      instance,
      message: 'Instância criada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar instância' },
      { status: 500 }
    );
  }
}
