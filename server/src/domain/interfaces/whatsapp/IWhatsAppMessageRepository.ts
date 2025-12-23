// domain/interfaces/whatsapp/IWhatsAppMessageRepository.ts

import { WhatsAppMessage } from '../../entities/whatsapp/WhatsAppMessage.js';

export interface IWhatsAppMessageRepository {
  save(message: WhatsAppMessage): Promise<WhatsAppMessage>;
  
  findById(id: string, tenantId: string): Promise<WhatsAppMessage | null>;
  
  findByConversationId(conversationId: string, tenantId: string): Promise<WhatsAppMessage[]>;
  
  findByExternalId(externalMessageId: string, tenantId: string): Promise<WhatsAppMessage | null>;
  
  updateStatus(
    id: string, 
    status: string, 
    timestamp: Date, 
    tenantId: string
  ): Promise<void>;
  
  markAsDelivered(id: string, tenantId: string): Promise<void>;
  
  markAsRead(id: string, tenantId: string): Promise<void>;
  
  markAsFailed(id: string, errorCode: string, errorMessage: string, tenantId: string): Promise<void>;
}
