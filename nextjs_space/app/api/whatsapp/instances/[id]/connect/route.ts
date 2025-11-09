
import { NextRequest, NextResponse } from 'next/server';
import { baileysService } from '@/lib/whatsapp/baileys-service';

/**
 * POST /api/whatsapp/instances/[id]/connect
 * Conecta uma instância e gera QR Code
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se instância existe
    const instance = await baileysService.getInstance(params.id);

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instância não encontrada' },
        { status: 404 }
      );
    }

    // Conectar instância
    await baileysService.connectInstance(params.id);

    return NextResponse.json({
      success: true,
      message: 'Conectando instância... Aguarde o QR Code.',
    });
  } catch (error) {
    console.error('Erro ao conectar instância:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao conectar instância' },
      { status: 500 }
    );
  }
}
