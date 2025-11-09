
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InstancesManager } from '@/components/whatsapp/instances-manager';
import TemplatesManager from '@/components/whatsapp/templates-manager';
import CampaignsManager from '@/components/whatsapp/campaigns-manager';
import ContactsManager from '@/components/whatsapp/contacts-manager';

export default function WhatsAppAdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DevSphere.ai - WhatsApp Business
            </h1>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold">
              Plataforma de Automação
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-900">🚀 Início Rápido - DevSphere.ai</CardTitle>
              <CardDescription>Siga os passos abaixo para começar a usar o sistema de automação WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">1.</span>
                  <span><strong>Números/Instâncias:</strong> Conecte seus números WhatsApp via QR Code. Cada número é uma instância independente</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">2.</span>
                  <span><strong>Templates:</strong> Crie modelos de mensagem com variáveis personalizáveis e imagens</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">3.</span>
                  <span><strong>Contatos:</strong> Importe ou adicione contatos manualmente no formato brasileiro</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">4.</span>
                  <span><strong>Campanhas:</strong> Configure disparos em massa com intervalos personalizados</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="instances" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm shadow-lg">
            <TabsTrigger value="instances" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              📱 Números/Instâncias
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              📝 Templates
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              👥 Contatos
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              🚀 Campanhas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instances">
            <InstancesManager />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesManager />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsManager />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
