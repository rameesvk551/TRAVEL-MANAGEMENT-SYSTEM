// domain/interfaces/whatsapp/IWhatsAppConversationRepository.ts

import { WhatsAppConversation } from '../../entities/whatsapp/WhatsAppConversation.js';

export interface IWhatsAppConversationRepository {
  save(conversation: WhatsAppConversation): Promise<WhatsAppConversation>;
  
  findById(id: string, tenantId: string): Promise<WhatsAppConversation | null>;
  
  findByPhoneNumber(phoneNumber: string, tenantId: string): Promise<WhatsAppConversation | null>;
  
  findActiveByPhoneNumber(phoneNumber: string, tenantId: string): Promise<WhatsAppConversation | null>;
  
  findByBoundObject(objectType: string, objectId: string, tenantId: string): Promise<WhatsAppConversation[]>;
  
  updateState(id: string, state: string, stateData: Record<string, unknown>, tenantId: string): Promise<void>;
  
  markAsInactive(id: string, tenantId: string): Promise<void>;
  
  expireOldConversations(tenantId: string): Promise<number>;
}
