
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';

/**
 * GET /api/whatsapp/templates
 * Lista todos os templates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    // Gerar URLs assinadas para templates com mídia
    const templatesWithSignedUrls = await Promise.all(
      templates.map(async (template) => {
        if (template.mediaUrl) {
          const signedUrl = await downloadFile(template.mediaUrl);
          return { ...template, mediaUrl: signedUrl };
        }
        return template;
      })
    );

    return NextResponse.json({
      success: true,
      templates: templatesWithSignedUrls,
    });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/templates
 * Cria um novo template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content, variables, companyId, createdBy, mediaType, mediaUrl, mediaName } = body;

    if (!name || !content) {
      return NextResponse.json(
        { success: false, error: 'Nome e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    // Extrair variáveis do conteúdo (padrão {{variavel}})
    const extractedVariables = extractVariables(content);

    const template = await prisma.messageTemplate.create({
      data: {
        name,
        content,
        variables: variables || extractedVariables,
        companyId,
        createdBy,
        mediaType,
        mediaUrl,
        mediaName,
      },
    });

    return NextResponse.json({
      success: true,
      template,
      message: 'Template criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar template' },
      { status: 500 }
    );
  }
}

/**
 * Extrai variáveis do template (padrão {{variavel}})
 */
function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(regex);
  const variables = new Set<string>();

  for (const match of matches) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}
