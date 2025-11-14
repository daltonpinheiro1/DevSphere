
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
  instance_id: string;
  to: string; // Número no formato 5531999887766
  message: string;
  delayMs?: number;
  mediaUrl?: string;
}

export interface BulkSendOptions {
  instance_id: string;
  contacts: Array<{
    phone_number: string;
    message: string;
    variables?: Record<string, string>;
    mediaUrl?: string;
  }>;
  interval_min: number; // segundos
  interval_max: number; // segundos
  onProgress?: (sent: number, total: number, status: string) => void;
}

export interface WebhookMessage {
  instance_id: string;
  from: string;
  message: string;
  message_id: string;
  timestamp: Date;
}
