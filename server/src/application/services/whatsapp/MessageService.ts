// application/services/whatsapp/MessageService.ts
// Core message handling - inbound/outbound

import {
  WhatsAppMessage,
  MessageDirection,
  DeliveryStatus,
} from '../../../domain/entities/whatsapp/index.js';
import {
  IMessageRepository,
  IWhatsAppProvider,
  SendMessageRequest,
  IncomingMessage,
  MessageStatusUpdate,
} from '../../../domain/interfaces/whatsapp/index.js';
import {
  ProcessInboundMessageDTO,
  ProcessedMessageResult,
  SendTextMessageDTO,
  SendTemplateMessageDTO,
  SendInteractiveMessageDTO,
  MessageSentResult,
} from '../../dtos/whatsapp/index.js';
import { ConversationService } from './ConversationService.js';
import { TimelineService } from './TimelineService.js';

/**
 * MessageService - Handles all WhatsApp message operations
 * 
 * CRITICAL: All business logic calls go to existing services.
 * This service only handles message plumbing.
 */
export class MessageService {
  constructor(
    private messageRepo: IMessageRepository,
    private provider: IWhatsAppProvider,
    private conversationService: ConversationService,
    private timelineService: TimelineService
  ) {}

  /**
   * Process an inbound message from webhook
   */
  async processInbound(
    dto: ProcessInboundMessageDTO
  ): Promise<ProcessedMessageResult> {
    // 1. Idempotency check
    const existing = await this.messageRepo.findByProviderMessageId(
      dto.providerMessageId,
      dto.tenantId
    );
    if (existing) {
      return {
        messageId: existing.id,
        conversationId: existing.conversationId,
        isNewConversation: false,
        suggestedActions: [],
        requiresHumanReview: false,
      };
    }

    // 2. Get or create conversation context
    const context = await this.conversationService.getOrCreateContext(
      dto.tenantId,
      dto.senderPhone,
      'CUSTOMER'
    );
    const isNewConversation = context.messageCount === 0;

    // 3. Create message entity
    const message = WhatsAppMessage.create({
      tenantId: dto.tenantId,
      conversationId: context.id,
      providerMessageId: dto.providerMessageId,
      providerTimestamp: dto.providerTimestamp,
      direction: 'INBOUND',
      senderPhone: dto.senderPhone,
      recipientPhone: dto.recipientPhone,
      messageType: dto.messageType,
      textContent: dto.textBody ? { body: dto.textBody } : undefined,
      mediaContent: dto.mediaUrl ? {
        mediaId: dto.providerMessageId,
        mimeType: 'unknown',
        downloadUrl: dto.mediaUrl,
        caption: dto.mediaCaption,
      } : undefined,
      locationContent: dto.locationLat ? {
        latitude: dto.locationLat,
        longitude: dto.locationLng!,
      } : undefined,
      selectedButtonId: dto.selectedButtonId,
      selectedListItemId: dto.selectedListItemId,
      replyToMessageId: dto.replyToMessageId,
      status: 'DELIVERED',
      statusTimestamps: { delivered: new Date() },
      isProcessed: false,
      requiresResponse: true,
      idempotencyKey: `${dto.providerMessageId}-${dto.tenantId}`,
    });

    // 4. Save message
    const saved = await this.messageRepo.save(message);

    // 5. Update conversation activity
    await this.conversationService.recordActivity(context.id, dto.tenantId);

    // 6. Add to timeline
    await this.timelineService.recordWhatsAppMessage(
      saved,
      context,
      'INBOUND'
    );

    // 7. Mark as read in provider
    await this.provider.markAsRead(dto.providerMessageId);

    // 8. Determine suggested actions based on context
    const suggestedActions = this.getSuggestedActions(context, message);
    const requiresHumanReview = this.requiresHuman(message);

    return {
      messageId: saved.id,
      conversationId: context.id,
      isNewConversation,
      linkedTo: context.primaryEntity ? {
        type: context.primaryEntity.type,
        entityId: context.primaryEntity.entityId,
      } : undefined,
      suggestedActions,
      requiresHumanReview,
    };
  }

  /**
   * Send a text message
   */
  async sendText(dto: SendTextMessageDTO): Promise<MessageSentResult> {
    // 1. Get conversation context
    const context = await this.conversationService.getOrCreateContext(
      dto.tenantId,
      dto.recipientPhone,
      'SALES_AGENT'
    );

    // 2. Send via provider
    const result = await this.provider.sendMessage({
      recipientPhone: dto.recipientPhone,
      messageType: 'TEXT',
      textContent: { body: dto.text },
      replyToMessageId: dto.replyToMessageId,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.errorMessage,
        errorCode: result.errorCode,
      };
    }

    // 3. Create message record
    const message = WhatsAppMessage.create({
      tenantId: dto.tenantId,
      conversationId: context.id,
      providerMessageId: result.providerMessageId!,
      providerTimestamp: result.timestamp,
      direction: 'OUTBOUND',
      senderPhone: dto.recipientPhone, // Business number
      recipientPhone: dto.recipientPhone,
      messageType: 'TEXT',
      textContent: { body: dto.text },
      status: 'SENT',
      statusTimestamps: { sent: result.timestamp },
      handledByUserId: dto.senderUserId,
      isProcessed: true,
      requiresResponse: false,
      idempotencyKey: `${result.providerMessageId}-${dto.tenantId}`,
    });

    const saved = await this.messageRepo.save(message);

    // 4. Link to entity if specified
    if (dto.linkTo) {
      await this.conversationService.linkToEntity(
        context.id,
        dto.tenantId,
        dto.linkTo.type,
        dto.linkTo.entityId
      );
    }

    // 5. Add to timeline
    await this.timelineService.recordWhatsAppMessage(saved, context, 'OUTBOUND');

    return {
      success: true,
      messageId: saved.id,
      providerMessageId: result.providerMessageId,
    };
  }

  /**
   * Send a template message
   */
  async sendTemplate(dto: SendTemplateMessageDTO): Promise<MessageSentResult> {
    // Build template components from variables
    const components = Object.entries(dto.variables).map(([key, value], idx) => ({
      type: 'body' as const,
      parameters: [{ type: 'text' as const, value }],
    }));

    const result = await this.provider.sendTemplate(
      dto.recipientPhone,
      dto.templateName,
      dto.language || 'en',
      components
    );

    if (!result.success) {
      return {
        success: false,
        error: result.errorMessage,
        errorCode: result.errorCode,
      };
    }

    // Get or create context and save message
    const context = await this.conversationService.getOrCreateContext(
      dto.tenantId,
      dto.recipientPhone,
      'SALES_AGENT'
    );

    const message = WhatsAppMessage.create({
      tenantId: dto.tenantId,
      conversationId: context.id,
      providerMessageId: result.providerMessageId!,
      providerTimestamp: result.timestamp,
      direction: 'OUTBOUND',
      senderPhone: dto.recipientPhone,
      recipientPhone: dto.recipientPhone,
      messageType: 'TEMPLATE',
      templateContent: {
        templateName: dto.templateName,
        language: dto.language || 'en',
        components,
      },
      status: 'SENT',
      statusTimestamps: { sent: result.timestamp },
      handledByUserId: dto.senderUserId,
      isProcessed: true,
      requiresResponse: false,
      idempotencyKey: `${result.providerMessageId}-${dto.tenantId}`,
    });

    const saved = await this.messageRepo.save(message);

    return {
      success: true,
      messageId: saved.id,
      providerMessageId: result.providerMessageId,
    };
  }

  /**
   * Send interactive message (buttons/lists)
   */
  async sendInteractive(dto: SendInteractiveMessageDTO): Promise<MessageSentResult> {
    const result = await this.provider.sendMessage({
      recipientPhone: dto.recipientPhone,
      messageType: 'INTERACTIVE',
      interactiveContent: {
        type: dto.buttons ? 'BUTTON' : 'LIST',
        header: dto.headerText,
        body: dto.bodyText,
        footer: dto.footerText,
        buttons: dto.buttons,
        sections: dto.listSections,
      },
    });

    if (!result.success) {
      return {
        success: false,
        error: result.errorMessage,
        errorCode: result.errorCode,
      };
    }

    // Save message record
    const context = await this.conversationService.getOrCreateContext(
      dto.tenantId,
      dto.recipientPhone,
      'SALES_AGENT'
    );

    const message = WhatsAppMessage.create({
      tenantId: dto.tenantId,
      conversationId: context.id,
      providerMessageId: result.providerMessageId!,
      providerTimestamp: result.timestamp,
      direction: 'OUTBOUND',
      senderPhone: dto.recipientPhone,
      recipientPhone: dto.recipientPhone,
      messageType: 'INTERACTIVE',
      interactiveContent: {
        type: dto.buttons ? 'BUTTON' : 'LIST',
        body: dto.bodyText,
        buttons: dto.buttons,
        sections: dto.listSections,
      },
      status: 'SENT',
      statusTimestamps: { sent: result.timestamp },
      handledByUserId: dto.senderUserId,
      isProcessed: true,
      requiresResponse: true,
      idempotencyKey: `${result.providerMessageId}-${dto.tenantId}`,
    });

    await this.messageRepo.save(message);

    return {
      success: true,
      messageId: message.id,
      providerMessageId: result.providerMessageId,
    };
  }

  /**
   * Handle status update webhook
   */
  async handleStatusUpdate(update: MessageStatusUpdate): Promise<void> {
    // Find message by provider ID
    // Note: We'd need tenant context from the webhook
    // For now, using idempotency key pattern
    const status: DeliveryStatus = update.status === 'sent' ? 'SENT' :
      update.status === 'delivered' ? 'DELIVERED' :
      update.status === 'read' ? 'READ' : 'FAILED';

    // This would need to be updated to handle tenant context properly
    // For now, simplified version
  }

  /**
   * Get suggested actions based on context
   */
  private getSuggestedActions(
    context: ReturnType<typeof import('../../../domain/entities/whatsapp/index.js').ConversationContext.create>,
    message: WhatsAppMessage
  ): string[] {
    const actions: string[] = [];

    if (!context.hasLinkedEntity) {
      actions.push('CREATE_LEAD');
    }

    if (context.primaryEntity?.type === 'LEAD') {
      actions.push('VIEW_LEAD', 'SEND_QUOTE', 'CREATE_BOOKING');
    }

    if (context.primaryEntity?.type === 'BOOKING') {
      actions.push('VIEW_BOOKING', 'SEND_PAYMENT_LINK', 'SEND_REMINDER');
    }

    return actions;
  }

  /**
   * Determine if message requires human review
   */
  private requiresHuman(message: WhatsAppMessage): boolean {
    // Simple heuristics - could be enhanced with NLP
    const text = message.textBody.toLowerCase();
    
    const urgentKeywords = ['urgent', 'emergency', 'refund', 'cancel', 'complaint', 'help'];
    return urgentKeywords.some(kw => text.includes(kw));
  }
}
