
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/users/[id]
 * Busca usuário por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
        createdUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Atualiza usuário
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, password, role, isActive, companyId } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (companyId) updateData.companyId = companyId;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Remove usuário (soft delete - apenas desativa)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao desativar usuário' },
      { status: 500 }
    );
  }
}
