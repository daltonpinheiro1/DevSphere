
import { NextRequest, NextResponse } from 'next/server';
import { baileysService } from '@/lib/whatsapp/baileys-service';

/**
 * POST /api/whatsapp/instances/[id]/disconnect
 * Desconecta uma instância e limpa a sessão
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await baileysService.disconnectInstance(params.id);

    return NextResponse.json({
      success: true,
      message: 'Instância desconectada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desconectar instância:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao desconectar instância' },
      { status: 500 }
    );
  }
}
