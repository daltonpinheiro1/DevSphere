
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const files = await prisma.chatbot_training_files.findMany({
      where: { chatbot_id: params.id },
      orderBy: {
        uploaded_at: 'desc',
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar arquivos' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo (apenas texto, PDF, JSON)
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Apenas TXT, PDF, JSON, CSV ou DOCX' },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    // Fazer upload para S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `chatbot_training/${params.id}/${Date.now()}_${file.name}`;
    const cloudStoragePath = await uploadFile(buffer, fileName);

    // Salvar no banco
    const trainingFile = await prisma.chatbot_training_files.create({
      data: {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chatbot_id: params.id,
        file_name: file.name,
        file_url: cloudStoragePath,
        file_size: file.size,
        file_type: file.type,
      },
    });

    return NextResponse.json(trainingFile);
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}
