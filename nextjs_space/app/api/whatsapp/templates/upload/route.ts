
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, downloadFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato não suportado' },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Converter para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload para S3
    const cloud_storage_path = await uploadFile(buffer, file.name);
    
    // Gerar URL assinada para acesso
    const signedUrl = await downloadFile(cloud_storage_path);

    return NextResponse.json({
      success: true,
      url: signedUrl,
      cloud_storage_path: cloud_storage_path,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upload' },
      { status: 500 }
    );
  }
}
