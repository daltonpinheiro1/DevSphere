
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/admin/users
 * Lista todos os usuários (apenas ADMIN e MANAGER podem acessar)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const company_id = searchParams.get('company_id');

    const where: any = {};
    if (role) where.role = role;
    if (company_id) where.company_id = company_id;

    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        is_active: true,
        company_id: true,
        created_by: true,
        created_at: true,
        updated_at: true,
        users: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
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
    const { name, email, password, role, company_id, created_by } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nome, email, senha e role são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Verificar permissões do criador
    if (created_by) {
      const creator = await prisma.users.findUnique({
        where: { id: created_by },
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
    const password_hash = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.users.create({
      data: {
        id: uuidv4(),
        name,
        email,
        password_hash,
        role,
        company_id,
        created_by,
        is_active: true,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company_id: true,
        is_active: true,
        created_at: true,
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
