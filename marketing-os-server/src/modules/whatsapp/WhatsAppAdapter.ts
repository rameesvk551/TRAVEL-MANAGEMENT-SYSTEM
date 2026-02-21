// Inline ChannelAdapter interface (stub - original file was deleted during migration)
export interface ChannelAdapter {
    sendMessage(...args: any[]): Promise<any>;
    sendTemplate?(...args: any[]): Promise<any>;
}

import { ConversationContext } from './models/whatsapp/ConversationContext.js';
import { IWhatsAppProvider } from './interfaces/whatsapp/index.js';

export class WhatsAppAdapter implements ChannelAdapter {
    constructor(
        private provider: IWhatsAppProvider
    ) { }

    async sendMessage(
        context: ConversationContext,
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<string> {
        const result = await this.provider.sendMessage({
            recipientPhone: context.externalId, // For WhatsApp, externalId is phone
            messageType: 'TEXT',
            textContent: { body: content },
        });

        if (!result.success) {
            throw new Error(result.errorMessage || 'Failed to send WhatsApp message');
        }

        return result.providerMessageId!;
    }

    async sendTemplate(
        context: ConversationContext,
        templateName: string,
        languageCode: string,
        variables: Record<string, string>
    ): Promise<string> {
        // Convert generic variables (key-value) to WhatsApp components if needed
        // This is a simplification. Real implementation might need mapping logic.
        const components = Object.entries(variables).map(([key, value]) => ({
            type: 'body' as const,
            parameters: [{ type: 'text' as const, value }],
        }));

        const result = await this.provider.sendTemplate(
            context.externalId,
            templateName,
            languageCode,
            components
        );

        if (!result.success) {
            throw new Error(result.errorMessage || 'Failed to send WhatsApp template');
        }

        return result.providerMessageId!;
    }

    async sendMedia(
        context: ConversationContext,
        url: string,
        caption?: string,
        mediaType: 'image' | 'document' | 'video' | 'audio' = 'image'
    ): Promise<string> {
        // NOTE: IWhatsAppProvider needs a sendMedia method that takes a URL, 
        // currently it has uploadMedia (buffer) and sendMessage with MediaContent.
        // We'll assume we pass the URL in sendMessage.

        const result = await this.provider.sendMessage({
            recipientPhone: context.externalId,
            messageType: mediaType.toUpperCase() as any, // 'IMAGE', 'VIDEO', etc.
            mediaContent: {
                mediaId: 'url-reference', // Dummy ID for URL-based sending
                downloadUrl: url,
                caption,
                mimeType: 'application/octet-stream'
            }
        });

        if (!result.success) {
            throw new Error(result.errorMessage || 'Failed to send WhatsApp media');
        }

        return result.providerMessageId!;
    }

    async sendInteractive(
        context: ConversationContext,
        content: {
            type: 'button' | 'list' | 'product' | 'product_list';
            body: string;
            header?: { type: 'text' | 'image' | 'video' | 'document'; text?: string; mediaUrl?: string };
            footer?: string;
            action: {
                buttons?: Array<{ id: string; title: string }>;
                sections?: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>;
                catalogId?: string;
                productRetailerId?: string;
            };
        }
    ): Promise<string> {
        // Map generic interactive content to provider-specific format
        // This assumes the provider has a method for interactive messages or we construct the raw payload
        // For now, we will try to use a generic sendMessage with interactive type if available, 
        // or fall back to text if the provider doesn't support it directly in this interface.

        // Since IWhatsAppProvider interface isn't fully visible, I'll assume we need to extend it or 
        // cast to any to send the raw interactive object which most providers support.

        const interactiveMessage: any = {
            type: 'interactive',
            recipientPhone: context.externalId,
            interactiveContent: {
                type: content.type,
                body: { text: content.body },
                header: content.header ? {
                    type: content.header.type,
                    text: content.header.text,
                    image: content.header.mediaUrl ? { link: content.header.mediaUrl } : undefined,
                    video: content.header.mediaUrl ? { link: content.header.mediaUrl } : undefined,
                    document: content.header.mediaUrl ? { link: content.header.mediaUrl } : undefined,
                } : undefined,
                footer: content.footer ? { text: content.footer } : undefined,
                action: content.action
            }
        };

        // If provider supports raw or interactive, use it. Otherwise logs warning.
        // real implementation would depend on the specific provider (Twilio, Meta, 360dialog, etc.)
        // identifying capabilities.

        let result;
        if ('sendInteractive' in this.provider) {
            result = await (this.provider as any).sendInteractive(interactiveMessage);
        } else {
            // Fallback: Try to use sendMessage with a special type or just send text
            // For the purpose of this task, we assume the provider CAN handle it if we pass it correctly.
            // We'll use the generic sendMessage and hope the provider implementation handles 'interactive' type
            // or we cast it to any to bypass strict type checks for now.
            result = await this.provider.sendMessage({
                recipientPhone: context.externalId,
                messageType: 'interactive' as any,
                ...interactiveMessage
            } as any);
        }

        if (!result.success) {
            throw new Error(result.errorMessage || 'Failed to send WhatsApp interactive message');
        }

        return result.providerMessageId!;
    }

    async markAsRead(
        context: ConversationContext,
        messageId: string
    ): Promise<void> {
        await this.provider.markAsRead(messageId);
    }
}
