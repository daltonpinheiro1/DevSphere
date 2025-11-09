
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/whatsapp/contacts
 * Lista contatos com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { campaignMessages: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar contatos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/contacts
 * Adiciona um novo contato manualmente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, name, companyId, metadata } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Número de telefone é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato brasileiro (11 dígitos)
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.length < 10 || cleanedNumber.length > 13) {
      return NextResponse.json(
        {
          success: false,
          error: 'Número inválido. Use formato: DDD + número (ex: 31999887766)',
        },
        { status: 400 }
      );
    }

    // Garantir que tem código do país (55)
    const formattedNumber = cleanedNumber.startsWith('55')
      ? cleanedNumber
      : `55${cleanedNumber}`;

    const contact = await prisma.contact.upsert({
      where: {
        phoneNumber_companyId: {
          phoneNumber: formattedNumber,
          companyId: companyId || null,
        },
      },
      update: {
        name,
        metadata: metadata || undefined,
      },
      create: {
        phoneNumber: formattedNumber,
        name,
        companyId,
        metadata: metadata || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      contact,
      message: 'Contato adicionado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao adicionar contato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar contato' },
      { status: 500 }
    );
  }
}
