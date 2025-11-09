
import { NextRequest, NextResponse } from 'next/server';
import { baileysService } from '@/lib/whatsapp/baileys-service';

/**
 * GET /api/whatsapp/instances/[id]/qrcode
 * Obtém o QR Code atual de uma instância
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

    if (!instance.qrCode) {
      return NextResponse.json(
        { success: false, error: 'QR Code não disponível' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      qrCode: instance.qrCode,
      status: instance.status,
    });
  } catch (error) {
    console.error('Erro ao buscar QR code:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar QR code' },
      { status: 500 }
    );
  }
}
