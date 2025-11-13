
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/users
 * Lista todos os usuários (apenas ADMIN e MANAGER podem acessar)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const companyId = searchParams.get('companyId');

    const where: any = {};
    if (role) where.role = role;
    if (companyId) where.companyId = companyId;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        companyId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Cria novo usuário (apenas ADMIN pode criar MANAGER, MANAGER pode criar ASSISTANT)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, companyId, createdBy } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nome, email, senha e role são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Verificar permissões do criador
    if (createdBy) {
      const creator = await prisma.user.findUnique({
        where: { id: createdBy },
      });

      if (!creator) {
        return NextResponse.json(
          { error: 'Usuário criador não encontrado' },
          { status: 404 }
        );
      }

      // ADMIN pode criar qualquer role
      // MANAGER pode criar apenas ASSISTANT
      if (creator.role === 'MANAGER' && role !== 'ASSISTANT') {
        return NextResponse.json(
          { error: 'Gerentes só podem criar Auxiliares' },
          { status: 403 }
        );
      }
    }

    // Criar hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        companyId,
        createdBy,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
