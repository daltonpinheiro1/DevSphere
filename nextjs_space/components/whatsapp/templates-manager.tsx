'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Image from 'next/image';

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG, GIF ou WEBP');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setMediaFile(file);
    setMediaType('image');

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const saveTemplate = async () => {
    if (!name || !content) {
      toast.error('Nome e conteúdo são obrigatórios');
      return;
    }

    try {
      setUploading(true);
      const url = editingId
        ? `/api/whatsapp/templates/${editingId}`
        : '/api/whatsapp/templates';
      
      const method = editingId ? 'PATCH' : 'POST';

      // Se houver mídia, fazer upload primeiro
      let mediaUrl = null;
      let mediaName = null;
      
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        
        const uploadResponse = await fetch('/api/whatsapp/templates/upload', {
          method: 'POST',
          body: formData,
        });
        
        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          mediaUrl = uploadData.cloud_storage_path; // Salvar o path do S3
          mediaName = uploadData.fileName;
        } else {
          toast.error('Erro ao fazer upload da imagem');
          setUploading(false);
          return;
        }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          content,
          mediaType: mediaType,
          mediaUrl: mediaUrl,
          mediaName: mediaName
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingId ? 'Template atualizado!' : 'Template criado!');
        resetForm();
        fetchTemplates();
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro ao salvar template');
    } finally {
      setUploading(false);
    }
  };

  const editTemplate = (template: any) => {
    setEditingId(template.id);
    setName(template.name);
    setContent(template.content);
    setMediaType(template.mediaType);
    setMediaPreview(template.mediaUrl);
    setShowDialog(true);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Deseja realmente excluir este template?')) return;

    try {
      const response = await fetch(`/api/whatsapp/templates/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Template excluído');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Erro ao excluir template');
    }
  };

  const resetForm = () => {
    setName('');
    setContent('');
    setEditingId(null);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Templates de Mensagens</CardTitle>
              <CardDescription>Crie templates com variáveis como {`{{nome}}, {{empresa}}`}</CardDescription>
            </div>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum template criado</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => editTemplate(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => deleteTemplate(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {template.mediaUrl && template.mediaType === 'image' && (
                      <div className="mb-3 relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={template.mediaUrl}
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.content}</p>
                    {template.variables?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {template.variables.map((v: string) => (
                          <span key={v} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                    {template.mediaType && (
                      <div className="mt-2 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-500">{template.mediaName || 'Imagem anexada'}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={resetForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Novo'} Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Template</Label>
              <Input
                placeholder="Centermed - Boas-vindas"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Upload de Imagem */}
            <div>
              <Label>Imagem (Opcional)</Label>
              {!mediaPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">
                      Clique para selecionar uma imagem
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF ou WEBP (Máx. 5MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                  <div className="relative w-full aspect-video bg-gray-100">
                    <Image
                      src={mediaPreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeMedia}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Mensagem</Label>
              <Textarea
                placeholder={`Olá! 👋 Bem-vindo à *Centermed*!\n\nSomos uma clínica especializada em cuidados médicos de excelência.\n\nComo posso ajudá-lo hoje?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-2">
                {`Use {{variavel}} para criar variáveis personalizáveis. Ex: Olá {{nome}}, bem-vindo à Centermed!`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={uploading}>
              {uploading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
