
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            WhatsApp Business Manager
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas instâncias, contatos, templates e campanhas de envio em massa
          </p>
        </div>

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
