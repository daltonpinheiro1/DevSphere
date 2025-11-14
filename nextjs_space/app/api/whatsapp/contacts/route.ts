
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/whatsapp/contacts
 * Lista contatos com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('company_id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const where: any = {};

    if (company_id) {
      where.company_id = company_id;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { phone_number: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const contacts = await prisma.contacts.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { campaign_messages: true },
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
    const { phoneNumber, name, company_id, metadata } = body;

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

    const contact = await prisma.contacts.upsert({
      where: {
        phone_number_company_id: {
          phone_number: formattedNumber,
          company_id: company_id || null,
        },
      },
      update: {
        name,
        metadata: metadata || undefined,
      },
      create: {
        id: uuidv4(),
        phone_number: formattedNumber,
        name,
        company_id,
        metadata: metadata || undefined,
        updated_at: new Date(),
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
