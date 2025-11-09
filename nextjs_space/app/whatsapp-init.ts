// Inicialização do sistema WhatsApp
// Este arquivo é importado automaticamente pelo Next.js
import { initializeWhatsAppSystem } from '@/lib/whatsapp/init';

// Inicializar sistema WhatsApp no startup
if (typeof window === 'undefined') {
  // Apenas no servidor
  initializeWhatsAppSystem().catch((error) => {
    console.error('Erro ao inicializar sistema WhatsApp:', error);
  });
}

export {};
