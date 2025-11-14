
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/whatsapp/campaigns/[id]
 * Obtém detalhes de uma campanha
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaigns.findUnique({
      where: { id: params.id },
      include: {
        whatsapp_instances: true,
        message_templates: true,
        campaign_messages: {
          include: {
        contacts: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    // Estatísticas
    const stats = {
      total: campaign.total_contacts,
      sent: campaign.sent_count,
      failed: campaign.failed_count,
      pending: campaign.total_contacts - campaign.sent_count - campaign.failed_count,
    };

    return NextResponse.json({
      success: true,
      campaign,
      stats,
    });
  } catch (error) {
    console.error('Erro ao buscar campanha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar campanha' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/whatsapp/campaigns/[id]
 * Atualiza uma campanha
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, intervalMin, intervalMax, riskLevel, scheduledAt } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (intervalMin !== undefined) updateData.intervalMin = intervalMin;
    if (intervalMax !== undefined) updateData.intervalMax = intervalMax;
    if (riskLevel) updateData.risk_level = riskLevel;
    if (scheduledAt !== undefined) {
      updateData.scheduled_at = scheduledAt ? new Date(scheduledAt) : null;
    }

    const campaign = await prisma.campaigns.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Campanha atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar campanha' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/campaigns/[id]
 * Exclui uma campanha
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.campaigns.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Campanha excluída com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir campanha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir campanha' },
      { status: 500 }
    );
  }
}
