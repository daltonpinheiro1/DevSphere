
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/whatsapp/chatbots - Listar chatbots disponíveis
export async function GET(req: NextRequest) {
  try {
    const chatbots = await prisma.chatbots.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        is_active: true,
      },
    });

    return NextResponse.json({ chatbots });
  } catch (error) {
    console.error('Erro ao listar chatbots:', error);
    return NextResponse.json(
      { error: 'Erro ao listar chatbots' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/chatbots - Criar novo chatbot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, system_prompt } = body;

    if (!name || !system_prompt) {
      return NextResponse.json(
        { error: 'Nome e system_prompt são obrigatórios' },
        { status: 400 }
      );
    }

    const chatbot = await prisma.chatbots.create({
      data: {
        id: uuidv4(),
        name,
        description: description || null,
        system_prompt,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ chatbot }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao criar chatbot' },
      { status: 500 }
    );
  }
}
