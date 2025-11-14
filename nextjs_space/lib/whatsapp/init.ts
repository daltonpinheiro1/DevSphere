
import { baileysService } from './baileys-service';
import { autoReplyHandler } from './auto-reply-handler';

/**
 * Inicializa o sistema WhatsApp quando a aplicação inicia
 */
export async function initializeWhatsAppSystem() {
  try {
    console.log('Inicializando sistema WhatsApp...');

    // Inicializar serviço Baileys
    await baileysService.initialize();

    // Registrar handler de auto-resposta para todas as instâncias
    const instances = await baileysService.getAllInstances();

    for (const instance of instances) {
      if (instance.auto_reply) {
        baileysService.registerMessageHandler(
          instance.id,
          (message) => autoReplyHandler.handleMessage(message)
        );
      }
    }

    console.log('Sistema WhatsApp inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar sistema WhatsApp:', error);
  }
}
