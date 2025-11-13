
export interface WhatsAppInstanceData {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  chatbotId?: string;
  company_id?: string;
  autoReply: boolean;
}

export interface SendMessageOptions {
  instanceId: string;
  to: string; // Número no formato 5531999887766
  message: string;
  delayMs?: number;
  mediaUrl?: string;
}

export interface BulkSendOptions {
  instanceId: string;
  contacts: Array<{
    phoneNumber: string;
    message: string;
    variables?: Record<string, string>;
    mediaUrl?: string;
  }>;
  intervalMin: number; // segundos
  intervalMax: number; // segundos
  onProgress?: (sent: number, total: number, status: string) => void;
}

export interface WebhookMessage {
  instanceId: string;
  from: string;
  message: string;
  messageId: string;
  timestamp: Date;
}
