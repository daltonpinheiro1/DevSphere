
import { NextRequest, NextResponse } from 'next/server';
import { campaignManager } from '@/lib/whatsapp/campaign-manager';

/**
 * POST /api/whatsapp/campaigns/[id]/pause
 * Pausa uma campanha em execução
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await campaignManager.pauseCampaign(params.id);

    return NextResponse.json({
      success: true,
      message: 'Campanha pausada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao pausar campanha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao pausar campanha' },
      { status: 500 }
    );
  }
}
