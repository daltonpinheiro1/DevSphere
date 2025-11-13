'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactsManager() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const response = await fetch(`/api/whatsapp/contacts?${params}`);
      const data = await response.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!phoneNumber) {
      toast.error('Número de telefone é obrigatório');
      return;
    }

    try {
      const response = await fetch('/api/whatsapp/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, name }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Contato adicionado!');
        setPhoneNumber('');
        setName('');
        fetchContacts();
      } else {
        toast.error(data.error || 'Erro ao adicionar');
      }
    } catch (error) {
      toast.error('Erro ao adicionar contato');
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/whatsapp/contacts/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchContacts();
      } else {
        toast.error(data.error || 'Erro no upload');
      }
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Contato</CardTitle>
            <CardDescription>Adicione um contato manualmente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Número (DDD + Número)</Label>
              <Input
                placeholder="31999887766"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <Label>Nome (opcional)</Label>
              <Input
                placeholder="João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button onClick={addContact} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload de Lista</CardTitle>
            <CardDescription>Importe contatos de um arquivo .txt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-4">
                Arraste um arquivo .txt ou clique para selecionar
              </p>
              <input
                type="file"
                accept=".txt"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contatos ({contacts.length})</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum contato encontrado</div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{contact.name || 'Sem nome'}</p>
                    <p className="text-sm text-gray-600">{contact.phone_number}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
