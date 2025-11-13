
import { NextRequest, NextResponse } from 'next/server';
import { timSalesFlow } from '@/lib/whatsapp/tim-sales-flow';
import { baileysService } from '@/lib/whatsapp/baileys-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, contactPhone } = body;

    if (!instanceId || !contactPhone) {
      return NextResponse.json(
        { error: 'instanceId e contactPhone são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar ou recuperar lead
    const lead = await timSalesFlow.getOrCreateLead(instanceId, contactPhone);

    // Obter mensagem inicial do fluxo
    const flowResponse = await timSalesFlow.handleMessage(
      instanceId,
      contactPhone,
      'iniciar'
    );

    // Enviar mensagem inicial
    await baileysService.sendMessage({
      instanceId,
      to: contactPhone,
      message: flowResponse.message,
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: flowResponse.message,
      stage: flowResponse.nextStage,
    });
  } catch (error) {
    console.error('Erro ao iniciar fluxo de vendas:', error);
    return NextResponse.json(
      { error: 'Erro ao iniciar fluxo de vendas' },
      { status: 500 }
    );
  }
}
