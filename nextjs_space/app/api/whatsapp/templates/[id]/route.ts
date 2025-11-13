
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/whatsapp/templates/[id]
 * Obtém detalhes de um template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.message_templates.findUnique({
      where: { id: params.id },
      include: {
        campaigns: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/whatsapp/templates/[id]
 * Atualiza um template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, content, variables, mediaType, mediaUrl, mediaName } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (content) {
      updateData.content = content;
      // Atualizar variáveis automaticamente se não fornecidas
      if (!variables) {
        updateData.variables = extractVariables(content);
      }
    }
    if (variables) updateData.variables = variables;
    if (mediaType !== undefined) updateData.media_type = mediaType;
    if (mediaUrl !== undefined) updateData.media_url = mediaUrl;
    if (mediaName !== undefined) updateData.media_name = mediaName;

    const template = await prisma.message_templates.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      template,
      message: 'Template atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/templates/[id]
 * Exclui um template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.message_templates.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Template excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir template:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir template' },
      { status: 500 }
    );
  }
}

function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(regex);
  const variables = new Set<string>();

  for (const match of matches) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}
