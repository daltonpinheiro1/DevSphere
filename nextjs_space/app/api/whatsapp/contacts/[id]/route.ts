
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/whatsapp/contacts/[id]
 * Obtém detalhes de um contato
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.contacts.findUnique({
      where: { id: params.id },
      include: {
        campaign_messages: {
          include: {
            campaigns: true,
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar contato' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/whatsapp/contacts/[id]
 * Atualiza um contato
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, metadata } = body;

    const contact = await prisma.contacts.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      contact,
      message: 'Contato atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar contato' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/contacts/[id]
 * Exclui um contato
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contacts.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Contato excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir contato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir contato' },
      { status: 500 }
    );
  }
}
