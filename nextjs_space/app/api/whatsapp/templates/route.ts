
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/whatsapp/templates
 * Lista todos os templates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('company_id');

    const where: any = {};
    if (company_id) {
      where.company_id = company_id;
    }

    const templates = await prisma.message_templates.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    // Gerar URLs assinadas para templates com mídia
    const templatesWithSignedUrls = await Promise.all(
      templates.map(async (template) => {
        if (template.media_url) {
          const signedUrl = await downloadFile(template.media_url);
          return { ...template, media_url: signedUrl };
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
    const { name, content, variables, company_id, created_by, mediaType, mediaUrl, mediaName } = body;

    if (!name || !content) {
      return NextResponse.json(
        { success: false, error: 'Nome e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    // Extrair variáveis do conteúdo (padrão {{variavel}})
    const extractedVariables = extractVariables(content);

    const template = await prisma.message_templates.create({
      data: {
        id: uuidv4(),
        name,
        content,
        variables: variables || extractedVariables,
        company_id,
        created_by,
        media_type: mediaType,
        media_url: mediaUrl,
        media_name: mediaName,
        updated_at: new Date(),
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
