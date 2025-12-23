// application/services/whatsapp/MessageRouter.ts
// Routes incoming WhatsApp messages to appropriate handlers

import { ConversationContextService } from './ConversationContextService.js';
import { TimelineService } from './TimelineService.js';
import { IWhatsAppMessageRepository } from '../../../domain/interfaces/whatsapp/IWhatsAppMessageRepository.js';
import { WhatsAppMessage } from '../../../domain/entities/whatsapp/WhatsAppMessage.js';

export interface IncomingMessage {
  from: string;
  messageId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: Date;
}

export interface MessageContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
  phoneNumber: string;
}

export interface MessageHandlerResult {
  success: boolean;
  response?: string;
  error?: string;
}

export class MessageRouter {
  constructor(
    private conversationService: ConversationContextService,
    private timelineService: TimelineService,
    private messageRepo: IWhatsAppMessageRepository
  ) {}

  /**
   * Route incoming message to appropriate handler
   */
  async routeMessage(
    message: IncomingMessage,
    context: MessageContext
  ): Promise<MessageHandlerResult> {
    try {
      // Get or create conversation
      const conversation = await this.conversationService.getOrCreateConversation(
        context.phoneNumber,
        context.tenantId,
        context.userId
      );

      // Save message to database
      const waMessage = WhatsAppMessage.create({
        tenantId: context.tenantId,
        conversationId: conversation.id,
        direction: 'INBOUND',
        messageType: message.type.toUpperCase() as any,
        senderPhone: message.from,
        content: message.text,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        externalMessageId: message.messageId,
        status: 'DELIVERED',
        sentAt: message.timestamp,
        deliveredAt: message.timestamp,
      });

      await this.messageRepo.save(waMessage);

      // Add to timeline if conversation is bound to an object
      if (conversation.isBound && conversation.boundObjectId && conversation.boundObjectType) {
        await this.timelineService.addWhatsAppMessage(
          conversation.boundObjectType,
          conversation.boundObjectId,
          message.text || '[Media]',
          'inbound',
          message.from,
          context.tenantId
        );
      }

      // Route based on conversation state and user role
      return await this.handleMessage(
        message,
        context,
        conversation.currentState
      );

    } catch (error) {
      console.error('Error routing message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle message based on state
   */
  private async handleMessage(
    message: IncomingMessage,
    context: MessageContext,
    state: string
  ): Promise<MessageHandlerResult> {
    const text = message.text?.toLowerCase() || '';

    // Handle based on user role and message intent
    if (!context.userRole) {
      return this.handleCustomerMessage(message, context);
    }

    switch (context.userRole) {
      case 'SALES':
        return this.handleSalesMessage(message, context);
      case 'OPERATIONS':
        return this.handleOperationsMessage(message, context);
      case 'GUIDE':
      case 'DRIVER':
        return this.handleFieldStaffMessage(message, context);
      case 'MANAGER':
        return this.handleManagerMessage(message, context);
      default:
        return this.handleCustomerMessage(message, context);
    }
  }

  /**
   * Handle customer messages
   */
  private async handleCustomerMessage(
    message: IncomingMessage,
    context: MessageContext
  ): Promise<MessageHandlerResult> {
    const text = message.text?.toLowerCase() || '';

    // Intent detection (simplified)
    if (text.includes('enquiry') || text.includes('tour') || text.includes('trek')) {
      return {
        success: true,
        response: 'Thank you for your enquiry! A sales representative will contact you shortly. Can you please share:\n1. Tour/Trek you\'re interested in\n2. Number of people\n3. Preferred dates',
      };
    }

    if (text.includes('booking') || text.includes('status')) {
      return {
        success: true,
        response: 'To check your booking status, please share your booking ID.',
      };
    }

    if (text.includes('payment') || text.includes('pay')) {
      return {
        success: true,
        response: 'To complete payment, please share your booking ID and we\'ll send you a payment link.',
      };
    }

    return {
      success: true,
      response: 'Hello! How can I help you today?\n\nType:\n- "Enquiry" for new bookings\n- "Status" to check booking\n- "Payment" for payment link',
    };
  }

  /**
   * Handle sales staff messages
   */
  private async handleSalesMessage(
    message: IncomingMessage,
    context: MessageContext
  ): Promise<MessageHandlerResult> {
    return {
      success: true,
      response: 'Sales operations: Use web dashboard or specific commands (CREATE_LEAD, SEND_QUOTE, etc.)',
    };
  }

  /**
   * Handle operations staff messages
   */
  private async handleOperationsMessage(
    message: IncomingMessage,
    context: MessageContext
  ): Promise<MessageHandlerResult> {
    return {
      success: true,
      response: 'Operations: Use web dashboard or specific commands (HOLD_SLOTS, ASSIGN_STAFF, etc.)',
    };
  }

  /**
   * Handle field staff messages
   */
  private async handleFieldStaffMessage(
    message: IncomingMessage,
    context: MessageContext
  ): Promise<MessageHandlerResult> {
    const text = message.text?.toLowerCase() || '';

    if (text.includes('checkin') || text.includes('start')) {
      return {
        success: true,
        response: 'To check in to a trip, reply with: CHECKIN <trip-id>',
      };
    }

    if (text.includes('issue') || text.includes('problem')) {
      return {
        success: true,
        response: 'To report an issue, reply with: ISSUE <trip-id> <description>',
      };
    }

    if (text.includes('checkout') || text.includes('end')) {
      return {
        success: true,
        response: 'To check out from a trip, reply with: CHECKOUT <trip-id>',
      };
    }

    return {
      success: true,
      response: 'Field Staff Commands:\n- CHECKIN <trip-id>\n- ISSUE <trip-id> <description>\n- CHECKOUT <trip-id>\n- Upload photos anytime',
    };
  }

  /**
   * Handle manager messages
   */
  private async handleManagerMessage(
    message: IncomingMessage,
    context: MessageContext
  ): Promise<MessageHandlerResult> {
    return {
      success: true,
      response: 'Manager operations: Use web dashboard for full access',
    };
  }
}
