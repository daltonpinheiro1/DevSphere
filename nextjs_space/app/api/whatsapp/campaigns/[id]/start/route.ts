
import { NextRequest, NextResponse } from 'next/server';
import { campaignManager } from '@/lib/whatsapp/campaign-manager';

/**
 * POST /api/whatsapp/campaigns/[id]/start
 * Inicia o envio de uma campanha
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await campaignManager.startCampaign(params.id);

    return NextResponse.json({
      success: true,
      message: 'Campanha iniciada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao iniciar campanha:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao iniciar campanha' },
      { status: 500 }
    );
  }
}
