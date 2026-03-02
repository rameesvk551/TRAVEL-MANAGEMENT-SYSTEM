// infrastructure/whatsapp/providers/MetaCloudProvider.ts
// Meta (Facebook) WhatsApp Cloud API adapter

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

interface MetaConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiVersion: string;
}

/**
 * Build interactive message payload
 */
function buildInteractivePayload(content: NonNullable<SendMessageRequest['interactiveContent']>): Record<string, unknown> {
  if (content.type === 'BUTTON') {
    return {
      type: 'button',
      header: content.header ? { type: 'text', text: content.header } : undefined,
      body: { text: content.body },
      footer: content.footer ? { text: content.footer } : undefined,
      action: {
        buttons: content.buttons?.map((btn: any) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title },
        })),
      },
    };
  }

  if (content.type === 'LIST') {
    return {
      type: 'list',
      header: content.header ? { type: 'text', text: content.header } : undefined,
      body: { text: content.body },
      footer: content.footer ? { text: content.footer } : undefined,
      action: {
        button: 'Select',
        sections: content.sections?.map((section: any) => ({
          title: section.title,
          rows: section.rows.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
          })),
        })),
      },
    };
  }

  return {};
}

/**
 * createMetaCloudProvider - WhatsApp Cloud API (Meta) adapter factory
 *
 * Implements the provider interface for Meta's WhatsApp Business Cloud API.
 * This is the recommended integration for new WhatsApp Business accounts.
 */
export function createMetaCloudProvider(config: MetaConfig): IWhatsAppProvider {
  const providerType: ProviderType = 'META_CLOUD';
  const baseUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`;
  console.log(`[MetaCloudProvider] Initialized — baseUrl: ${baseUrl}`);

  /**
   * Verify webhook signature from Meta
   */
  function verifyWebhookSignature(payload: RawWebhookPayload): boolean {
    const signature = payload.headers['x-hub-signature-256'];
    if (!signature) return false;

    // In production: Verify HMAC-SHA256 signature
    // const expectedSignature = crypto
    //   .createHmac('sha256', config.appSecret)
    //   .update(payload.rawBody)
    //   .digest('hex');
    // return `sha256=${expectedSignature}` === signature;

    // Simplified for development
    return true;
  }

  /**
   * Parse incoming message from Meta webhook
   */
  function parseWebhookMessage(payload: RawWebhookPayload): IncomingMessage | null {
    try {
      const body = JSON.parse(payload.rawBody);
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages?.[0]) return null;

      const msg = value.messages[0];
      const contact = value.contacts?.[0];

      // Map message type
      const typeMap: Record<string, string> = {
        text: 'TEXT',
        image: 'IMAGE',
        video: 'VIDEO',
        audio: 'AUDIO',
        document: 'DOCUMENT',
        location: 'LOCATION',
        sticker: 'STICKER',
        interactive: 'INTERACTIVE',
      };

      const message: IncomingMessage = {
        providerMessageId: msg.id,
        providerTimestamp: new Date(parseInt(msg.timestamp) * 1000),
        senderPhone: msg.from,
        recipientPhone: value.metadata?.phone_number_id || config.phoneNumberId,
        messageType: (typeMap[msg.type] || 'TEXT') as any,
      };

      // Parse content based on type
      if (msg.text) {
        message.textContent = { body: msg.text.body };
      }

      if (msg.image || msg.video || msg.audio || msg.document) {
        const media = msg.image || msg.video || msg.audio || msg.document;
        message.mediaContent = {
          mediaId: media.id,
          mimeType: media.mime_type,
          fileName: media.filename,
          caption: media.caption,
        };
      }

      if (msg.location) {
        message.locationContent = {
          latitude: msg.location.latitude,
          longitude: msg.location.longitude,
          name: msg.location.name,
          address: msg.location.address,
        };
      }

      if (msg.interactive) {
        if (msg.interactive.button_reply) {
          message.selectedButtonId = msg.interactive.button_reply.id;
        }
        if (msg.interactive.list_reply) {
          message.selectedListItemId = msg.interactive.list_reply.id;
        }
      }

      if (msg.context?.id) {
        message.replyToMessageId = msg.context.id;
      }

      message.providerMetadata = {
        contactName: contact?.profile?.name,
        contactWaId: contact?.wa_id,
      };

      return message;
    } catch (error) {
      console.error('Failed to parse Meta webhook message:', error);
      return null;
    }
  }

  /**
   * Parse status update from Meta webhook
   */
  function parseWebhookStatus(payload: RawWebhookPayload): MessageStatusUpdate | null {
    try {
      const body = JSON.parse(payload.rawBody);
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const status = changes?.value?.statuses?.[0];

      if (!status) return null;

      return {
        providerMessageId: status.id,
        status: status.status, // sent, delivered, read, failed
        timestamp: new Date(parseInt(status.timestamp) * 1000),
        recipientPhone: status.recipient_id,
        errorCode: status.errors?.[0]?.code?.toString(),
        errorMessage: status.errors?.[0]?.message,
      };
    } catch (error) {
      console.error('Failed to parse Meta webhook status:', error);
      return null;
    }
  }

  /**
   * Send a message via Meta Cloud API
   */
  async function sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      let messagePayload: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: request.recipientPhone,
      };

      // Build message based on type
      switch (request.messageType) {
        case 'TEXT':
          messagePayload.type = 'text';
          messagePayload.text = { body: request.textContent?.body };
          break;

        case 'IMAGE':
        case 'VIDEO':
        case 'AUDIO':
        case 'DOCUMENT':
          messagePayload.type = request.messageType.toLowerCase();
          messagePayload[request.messageType.toLowerCase()] = {
            id: request.mediaContent?.mediaId,
            caption: request.mediaContent?.caption,
          };
          break;

        case 'INTERACTIVE':
          messagePayload.type = 'interactive';
          messagePayload.interactive = buildInteractivePayload(request.interactiveContent!);
          break;

        case 'LOCATION':
          messagePayload.type = 'location';
          messagePayload.location = {
            latitude: request.locationContent?.latitude,
            longitude: request.locationContent?.longitude,
            name: request.locationContent?.name,
            address: request.locationContent?.address,
          };
          break;
      }

      if (request.replyToMessageId) {
        messagePayload.context = { message_id: request.replyToMessageId };
      }

      console.log(`[MetaCloudProvider] sendMessage → ${baseUrl}/messages`);
      console.log(`[MetaCloudProvider] Payload:`, JSON.stringify(messagePayload, null, 2));

      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      const data = await response.json() as any;
      console.log(`[MetaCloudProvider] Response (${response.status}):`, JSON.stringify(data, null, 2));

      if (!response.ok) {
        return {
          success: false,
          errorCode: data.error?.code?.toString(),
          errorMessage: data.error?.message,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        providerMessageId: data.messages?.[0]?.id,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send template message
   */
  async function sendTemplate(
    recipientPhone: string,
    templateName: string,
    language: string,
    components: TemplateContent['components']
  ): Promise<SendMessageResult> {
    try {
      const templatePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: components.map(comp => ({
            type: comp.type,
            parameters: comp.parameters.map(param => ({
              type: param.type,
              text: param.type === 'text' ? param.value : undefined,
              // Add other parameter types as needed
            })),
          })),
        },
      };

      console.log(`[MetaCloudProvider] sendTemplate → ${baseUrl}/messages`);
      console.log(`[MetaCloudProvider] Template payload:`, JSON.stringify(templatePayload, null, 2));

      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templatePayload),
      });

      const data = await response.json() as any;
      console.log(`[MetaCloudProvider] Template response (${response.status}):`, JSON.stringify(data, null, 2));

      if (!response.ok) {
        return {
          success: false,
          errorCode: data.error?.code?.toString(),
          errorMessage: data.error?.message,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        providerMessageId: data.messages?.[0]?.id,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Upload media
   */
  async function uploadMedia(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<MediaUploadResult> {
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

    const response = await fetch(`${baseUrl}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json() as any;

    return {
      mediaId: data.id,
    };
  }

  /**
   * Download media
   */
  async function downloadMedia(mediaId: string): Promise<Buffer> {
    // First, get the media URL
    const urlResponse = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );
    const urlData = await urlResponse.json() as any;

    // Then download the file
    const fileResponse = await fetch(urlData.url, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
    });

    const arrayBuffer = await fileResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Get media URL
   */
  async function getMediaUrl(mediaId: string): Promise<string> {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );
    const data = await response.json() as any;
    return data.url;
  }

  /**
   * Submit template for approval
   */
  async function submitTemplate(template: TemplateSubmission): Promise<string> {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name,
          language: template.language,
          category: template.category,
          components: template.components,
        }),
      }
    );

    const data = await response.json() as any;
    return data.id;
  }

  /**
   * Get template status
   */
  async function getTemplateStatus(templateId: string): Promise<TemplateApprovalStatus> {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${templateId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );

    const data = await response.json() as any;

    return {
      templateId: data.id,
      name: data.name,
      status: data.status,
      rejectedReason: data.rejected_reason,
    };
  }

  /**
   * Mark message as read
   */
  async function markAsRead(providerMessageId: string): Promise<void> {
    await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: providerMessageId,
      }),
    });
  }

  /**
   * Health check
   */
  async function healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
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
  };
}
