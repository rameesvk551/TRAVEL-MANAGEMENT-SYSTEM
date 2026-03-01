/**
 * Mock WhatsApp provider for development and testing.
 * Returns dummy success responses for all operations.
 */

import type {
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
import { v4 as uuidv4 } from 'uuid';

export function createMockProvider(): IWhatsAppProvider {
    return {
        providerType: 'MOCK' as ProviderType,

        verifyWebhookSignature(_payload: RawWebhookPayload): boolean {
            return true;
        },

        parseWebhookMessage(_payload: RawWebhookPayload): IncomingMessage | null {
            return null;
        },

        parseWebhookStatus(_payload: RawWebhookPayload): MessageStatusUpdate | null {
            return null;
        },

        async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
            const id = `mock_${uuidv4()}`;
            console.log(`[MockProvider] sendMessage to ${request.recipientPhone} → ${id}`);
            return { success: true, providerMessageId: id, timestamp: new Date() };
        },

        async sendTemplate(
            recipientPhone: string,
            templateName: string,
            _language: string,
            _components: any
        ): Promise<SendMessageResult> {
            const id = `mock_tpl_${uuidv4()}`;
            console.log(`[MockProvider] sendTemplate "${templateName}" to ${recipientPhone} → ${id}`);
            return { success: true, providerMessageId: id, timestamp: new Date() };
        },

        async uploadMedia(
            _fileBuffer: Buffer,
            _mimeType: string,
            _fileName: string
        ): Promise<MediaUploadResult> {
            return { mediaId: `mock_media_${uuidv4()}` };
        },

        async downloadMedia(_mediaId: string): Promise<Buffer> {
            return Buffer.from('mock-media-content');
        },

        async getMediaUrl(_mediaId: string): Promise<string> {
            return 'https://mock.example.com/media';
        },

        async submitTemplate(_template: TemplateSubmission): Promise<string> {
            return `mock_template_${uuidv4()}`;
        },

        async getTemplateStatus(templateId: string): Promise<TemplateApprovalStatus> {
            return { templateId, name: 'mock', status: 'APPROVED' };
        },

        async markAsRead(_providerMessageId: string): Promise<void> {
            // no-op
        },

        async healthCheck(): Promise<boolean> {
            return true;
        },
    };
}
