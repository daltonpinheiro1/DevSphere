
import { NextRequest, NextResponse } from 'next/server';
import { timSalesFlow } from '@/lib/whatsapp/tim-sales-flow';
import { baileysService } from '@/lib/whatsapp/baileys-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instance_id, contactPhone } = body;

    if (!instance_id || !contactPhone) {
      return NextResponse.json(
        { error: 'instance_id e contactPhone são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar ou recuperar lead
    const lead = await timSalesFlow.getOrCreateLead(instance_id, contactPhone);

    // Obter mensagem inicial do fluxo
    const flowResponse = await timSalesFlow.handleMessage(
      instance_id,
      contactPhone,
      'iniciar'
    );

    // Enviar mensagem inicial
    await baileysService.sendMessage({
      instance_id,
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
