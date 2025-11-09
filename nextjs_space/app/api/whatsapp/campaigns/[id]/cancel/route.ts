
import { NextRequest, NextResponse } from 'next/server';
import { campaignManager } from '@/lib/whatsapp/campaign-manager';

/**
 * POST /api/whatsapp/campaigns/[id]/cancel
 * Cancela uma campanha
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await campaignManager.cancelCampaign(params.id);

    return NextResponse.json({
      success: true,
      message: 'Campanha cancelada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao cancelar campanha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao cancelar campanha' },
      { status: 500 }
    );
  }
}
