// presentation/controllers/whatsapp/WebhookController.ts
// Handles incoming webhooks from WhatsApp providers

import { Request, Response, NextFunction } from 'express';
import {
  IWhatsAppProvider,
  RawWebhookPayload,
} from '../../../domain/interfaces/whatsapp/index.js';
import { MessageService } from '../../../application/services/whatsapp/index.js';

/**
 * WebhookController - Handles provider webhooks
 * 
 * This is the entry point for all incoming WhatsApp messages.
 * Normalizes provider-specific payloads and routes to MessageService.
 */
export class WebhookController {
  constructor(
    private provider: IWhatsAppProvider,
    private messageService: MessageService,
    private webhookVerifyToken: string
  ) {}

  /**
   * Webhook verification (GET) - Required by Meta
   */
  verify = async (req: Request, res: Response): Promise<void> => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      console.log('[Webhook] Verification successful');
      res.status(200).send(challenge);
    } else {
      console.log('[Webhook] Verification failed');
      res.status(403).send('Forbidden');
    }
  };

  /**
   * Webhook handler (POST) - Incoming messages and status updates
   */
  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Immediately respond 200 to prevent retries
      res.status(200).send('OK');

      const payload: RawWebhookPayload = {
        provider: this.provider.providerType,
        eventType: 'MESSAGE_RECEIVED',
        timestamp: new Date(),
        rawBody: JSON.stringify(req.body),
        signature: req.headers['x-hub-signature-256'] as string,
        headers: req.headers as Record<string, string>,
      };

      // Verify signature
      if (!this.provider.verifyWebhookSignature(payload)) {
        console.error('[Webhook] Invalid signature');
        return;
      }

      // Try to parse as message
      const message = this.provider.parseWebhookMessage(payload);
      if (message) {
        // Resolve tenant from business phone number
        // In production, this would lookup the tenant by WhatsApp number
        const tenantId = await this.resolveTenantId(message.recipientPhone);
        
        if (tenantId) {
          await this.messageService.processInbound({
            tenantId,
            providerMessageId: message.providerMessageId,
            providerTimestamp: message.providerTimestamp,
            senderPhone: message.senderPhone,
            recipientPhone: message.recipientPhone,
            messageType: message.messageType,
            textBody: message.textContent?.body,
            mediaUrl: message.mediaContent?.downloadUrl,
            mediaCaption: message.mediaContent?.caption,
            locationLat: message.locationContent?.latitude,
            locationLng: message.locationContent?.longitude,
            selectedButtonId: message.selectedButtonId,
            selectedListItemId: message.selectedListItemId,
            replyToMessageId: message.replyToMessageId,
            providerMetadata: message.providerMetadata,
          });
        }
        return;
      }

      // Try to parse as status update
      const status = this.provider.parseWebhookStatus(payload);
      if (status) {
        await this.messageService.handleStatusUpdate(status);
        return;
      }

      console.log('[Webhook] Unhandled event type');
    } catch (error) {
      // Log but don't fail - webhook must always return 200
      console.error('[Webhook] Processing error:', error);
    }
  };

  /**
   * Resolve tenant ID from WhatsApp business number
   */
  private async resolveTenantId(businessPhone: string): Promise<string | null> {
    // In production: lookup tenant by configured WhatsApp number
    // For now, return default tenant
    return process.env.DEFAULT_TENANT_ID || null;
  }
}
