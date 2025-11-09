'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const saveTemplate = async () => {
    if (!name || !content) {
      toast.error('Nome e conteúdo são obrigatórios');
      return;
    }

    try {
      const url = editingId
        ? `/api/whatsapp/templates/${editingId}`
        : '/api/whatsapp/templates';
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
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
    }
  };

  const editTemplate = (template: any) => {
    setEditingId(template.id);
    setName(template.name);
    setContent(template.content);
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
                placeholder="Ex: Boas-vindas Centermed"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Olá {{nome}}, bem-vindo à {{empresa}}!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-gray-500 mt-2">
                {`Use {{variavel}} para criar variáveis personalizáveis`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={saveTemplate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
