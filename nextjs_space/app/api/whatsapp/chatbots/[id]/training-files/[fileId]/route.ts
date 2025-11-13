
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const file = await prisma.chatbot_training_files.findUnique({
      where: { id: params.fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

    // Deletar do S3
    await deleteFile(file.file_url);

    // Deletar do banco
    await prisma.chatbot_training_files.delete({
      where: { id: params.fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo' },
      { status: 500 }
    );
  }
}
