
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatbot = await prisma.chatbots.findUnique({
      where: { id: params.id },
      include: {
        training_files: {
          orderBy: {
            uploaded_at: 'desc',
          },
        },
        whatsapp_instances: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            status: true,
          },
        },
      },
    });

    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error('Erro ao buscar chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar chatbot' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, system_prompt, is_active } = body;

    const updateData: any = {
      updated_at: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (system_prompt !== undefined) updateData.system_prompt = system_prompt;
    if (is_active !== undefined) updateData.is_active = is_active;

    const chatbot = await prisma.chatbots.update({
      where: { id: params.id },
      data: updateData,
      include: {
        training_files: true,
      },
    });

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error('Erro ao atualizar chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar chatbot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.chatbots.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar chatbot' },
      { status: 500 }
    );
  }
}
