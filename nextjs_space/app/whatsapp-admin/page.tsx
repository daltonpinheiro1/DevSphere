
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, FileText, Send } from 'lucide-react';
import InstancesManager from '@/components/whatsapp/instances-manager';
import ContactsManager from '@/components/whatsapp/contacts-manager';
import TemplatesManager from '@/components/whatsapp/templates-manager';
import CampaignsManager from '@/components/whatsapp/campaigns-manager';

export default function WhatsAppAdminPage() {
  const [activeTab, setActiveTab] = useState('instances');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WhatsApp Business Manager
            </h1>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              Centermed
            </span>
          </div>
          <p className="text-gray-600 mt-2">
            Gerencie suas instâncias, contatos, templates e campanhas de envio em massa
          </p>
        </div>
        
        {/* Quick Start Guide */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">🚀 Início Rápido - Centermed</CardTitle>
            <CardDescription>Siga estes passos para começar a enviar mensagens</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <span><strong>Instâncias:</strong> Crie uma nova instância (ex: "Centermed - Atendimento") e conecte via QR Code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <span><strong>Contatos:</strong> Importe ou adicione seus contatos manualmente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <span><strong>Templates:</strong> Crie mensagens personalizadas com variáveis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                <span><strong>Campanhas:</strong> Configure e inicie seu envio em massa com controle de intervalos</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Tabs defaultValue="instances" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger 
              value="instances" 
              className="flex items-center gap-2" 
              onClick={() => setActiveTab('instances')}
            >
              <MessageSquare className="h-4 w-4" />
              Instâncias
            </TabsTrigger>
            <TabsTrigger 
              value="contacts" 
              className="flex items-center gap-2"
              onClick={() => setActiveTab('contacts')}
            >
              <Users className="h-4 w-4" />
              Contatos
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="flex items-center gap-2"
              onClick={() => setActiveTab('templates')}
            >
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="flex items-center gap-2"
              onClick={() => setActiveTab('campaigns')}
            >
              <Send className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instances">
            <InstancesManager />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsManager />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesManager />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
