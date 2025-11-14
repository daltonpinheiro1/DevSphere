
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/whatsapp/contacts/upload
 * Faz upload de arquivo .txt com números de telefone
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const company_id = formData.get('company_id') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    // Validar extensão
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json(
        { success: false, error: 'Apenas arquivos .txt são permitidos' },
        { status: 400 }
      );
    }

    // Ler conteúdo do arquivo
    const content = await file.text();
    const lines = content.split('\n').filter((line) => line.trim());

    const results = {
      total: lines.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const line of lines) {
      try {
        // Extrair número (aceita vários formatos)
        const cleaned = line.trim().replace(/\D/g, '');

        if (cleaned.length < 10 || cleaned.length > 13) {
          results.failed++;
          results.errors.push(`Número inválido: ${line}`);
          continue;
        }

        // Garantir código do país
        const formattedNumber = cleaned.startsWith('55')
          ? cleaned
          : `55${cleaned}`;

        // Tentar extrair nome (se houver vírgula ou tab)
        let name = undefined;
        if (line.includes(',') || line.includes('\t')) {
          const parts = line.split(/[,\t]/);
          if (parts[1]) {
            name = parts[1].trim();
          }
        }

        await prisma.contacts.upsert({
          where: {
            phone_number_company_id: {
              phone_number: formattedNumber,
              company_id: company_id || null as any,
            },
          },
          update: {
            name: name || undefined,
          },
          create: {
            id: uuidv4(),
            phone_number: formattedNumber,
            name,
            company_id: company_id || undefined,
            updated_at: new Date(),
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Erro ao processar: ${line}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `${results.success} contatos importados, ${results.failed} falharam`,
    });
  } catch (error) {
    console.error('Erro ao fazer upload de contatos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upload de contatos' },
      { status: 500 }
    );
  }
}
