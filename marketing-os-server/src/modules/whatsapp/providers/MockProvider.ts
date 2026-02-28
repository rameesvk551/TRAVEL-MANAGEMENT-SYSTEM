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
} from '../interfaces/whatsapp/index.js';
import { TemplateContent } from '../models/whatsapp/index.js';
import { generateId } from '../../../shared/utils/index.js';

/**
 * createMockProvider - For development and testing
 *
 * Simulates WhatsApp API behavior without making real API calls.
 * Logs all operations for debugging.
 */
export function createMockProvider(): IWhatsAppProvider & {
  getSentMessages(): SendMessageRequest[];
  clearSentMessages(): void;
  simulateIncomingMessage(from: string, text: string): RawWebhookPayload;
} {
  const providerType: ProviderType = 'MOCK';
  const sentMessages: SendMessageRequest[] = [];

  function verifyWebhookSignature(payload: RawWebhookPayload): boolean {
    console.log('[MockProvider] Verifying webhook signature');
    return payload.signature === 'mock-valid-signature' || true;
  }

  function parseWebhookMessage(payload: RawWebhookPayload): IncomingMessage | null {
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

  function parseWebhookStatus(payload: RawWebhookPayload): MessageStatusUpdate | null {
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

  async function sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    console.log('[MockProvider] Sending message:', {
      to: request.recipientPhone,
      type: request.messageType,
      text: request.textContent?.body?.substring(0, 50),
    });

    sentMessages.push(request);

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

  async function sendTemplate(
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

  async function uploadMedia(
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

  async function downloadMedia(mediaId: string): Promise<Buffer> {
    console.log('[MockProvider] Downloading media:', mediaId);
    return Buffer.from('mock-media-content');
  }

  async function getMediaUrl(mediaId: string): Promise<string> {
    return `https://mock.whatsapp.com/media/${mediaId}`;
  }

  async function submitTemplate(template: TemplateSubmission): Promise<string> {
    console.log('[MockProvider] Submitting template:', template.name);
    return `mock_template_${generateId()}`;
  }

  async function getTemplateStatus(templateId: string): Promise<TemplateApprovalStatus> {
    return {
      templateId,
      name: 'mock_template',
      status: 'APPROVED',
    };
  }

  async function markAsRead(providerMessageId: string): Promise<void> {
    console.log('[MockProvider] Marking as read:', providerMessageId);
  }

  async function healthCheck(): Promise<boolean> {
    return true;
  }

  // Test helpers
  function getSentMessages(): SendMessageRequest[] {
    return sentMessages;
  }

  function clearSentMessages(): void {
    sentMessages.length = 0;
  }

  function simulateIncomingMessage(
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

  return {
    providerType,
    verifyWebhookSignature,
    parseWebhookMessage,
    parseWebhookStatus,
    sendMessage,
    sendTemplate,
    uploadMedia,
    downloadMedia,
    getMediaUrl,
    submitTemplate,
    getTemplateStatus,
    markAsRead,
    healthCheck,
    getSentMessages,
    clearSentMessages,
    simulateIncomingMessage,
  };
}
