// infrastructure/whatsapp/providers/MockProvider.ts
// Mock provider for development and testing

import {
  IWhatsAppProvider,
  ProviderType,
  RawWebhookPayload,
  IncomingMessage,
  MessageStatusUpdate,
  SendMessageRequest,
  SendMessageResult,
  TemplateSubmission,
  TemplateApprovalStatus,
  MediaUploadResult,
} from '../../../domain/interfaces/whatsapp/index.js';
import { TemplateContent } from '../../../domain/entities/whatsapp/index.js';
import { generateId } from '../../../shared/utils/index.js';

/**
 * MockProvider - For development and testing
 * 
 * Simulates WhatsApp API behavior without making real API calls.
 * Logs all operations for debugging.
 */
export class MockProvider implements IWhatsAppProvider {
  readonly providerType: ProviderType = 'MOCK';
  private sentMessages: SendMessageRequest[] = [];

  verifyWebhookSignature(payload: RawWebhookPayload): boolean {
    console.log('[MockProvider] Verifying webhook signature');
    return payload.signature === 'mock-valid-signature' || true;
  }

  parseWebhookMessage(payload: RawWebhookPayload): IncomingMessage | null {
    try {
      const body = JSON.parse(payload.rawBody);
      console.log('[MockProvider] Parsing incoming message:', body);
      
      return {
        providerMessageId: body.messageId || generateId(),
        providerTimestamp: new Date(),
        senderPhone: body.from || '+1234567890',
        recipientPhone: body.to || '+0987654321',
        messageType: body.type || 'TEXT',
        textContent: body.text ? { body: body.text } : undefined,
      };
    } catch {
      return null;
    }
  }

  parseWebhookStatus(payload: RawWebhookPayload): MessageStatusUpdate | null {
    try {
      const body = JSON.parse(payload.rawBody);
      if (!body.status) return null;

      return {
        providerMessageId: body.messageId,
        status: body.status,
        timestamp: new Date(),
        recipientPhone: body.to,
      };
    } catch {
      return null;
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    console.log('[MockProvider] Sending message:', {
      to: request.recipientPhone,
      type: request.messageType,
      text: request.textContent?.body?.substring(0, 50),
    });

    this.sentMessages.push(request);

    // Simulate success with 95% probability
    if (Math.random() > 0.05) {
      return {
        success: true,
        providerMessageId: `mock_${generateId()}`,
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      errorCode: 'MOCK_ERROR',
      errorMessage: 'Simulated failure for testing',
      timestamp: new Date(),
    };
  }

  async sendTemplate(
    recipientPhone: string,
    templateName: string,
    language: string,
    components: TemplateContent['components']
  ): Promise<SendMessageResult> {
    console.log('[MockProvider] Sending template:', {
      to: recipientPhone,
      template: templateName,
      language,
    });

    return {
      success: true,
      providerMessageId: `mock_tmpl_${generateId()}`,
      timestamp: new Date(),
    };
  }

  async uploadMedia(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<MediaUploadResult> {
    console.log('[MockProvider] Uploading media:', { fileName, mimeType, size: fileBuffer.length });
    
    return {
      mediaId: `mock_media_${generateId()}`,
      url: `https://mock.whatsapp.com/media/${generateId()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  async downloadMedia(mediaId: string): Promise<Buffer> {
    console.log('[MockProvider] Downloading media:', mediaId);
    return Buffer.from('mock-media-content');
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    return `https://mock.whatsapp.com/media/${mediaId}`;
  }

  async submitTemplate(template: TemplateSubmission): Promise<string> {
    console.log('[MockProvider] Submitting template:', template.name);
    return `mock_template_${generateId()}`;
  }

  async getTemplateStatus(templateId: string): Promise<TemplateApprovalStatus> {
    return {
      templateId,
      name: 'mock_template',
      status: 'APPROVED',
    };
  }

  async markAsRead(providerMessageId: string): Promise<void> {
    console.log('[MockProvider] Marking as read:', providerMessageId);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // Test helpers
  getSentMessages(): SendMessageRequest[] {
    return this.sentMessages;
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }

  simulateIncomingMessage(
    from: string,
    text: string
  ): RawWebhookPayload {
    return {
      provider: 'MOCK',
      eventType: 'MESSAGE_RECEIVED',
      timestamp: new Date(),
      rawBody: JSON.stringify({
        messageId: generateId(),
        from,
        to: '+business',
        type: 'TEXT',
        text,
      }),
      headers: {},
    };
  }
}
