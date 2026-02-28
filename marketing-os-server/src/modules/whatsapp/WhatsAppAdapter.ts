// Inline ChannelAdapter interface (stub - original file was deleted during migration)
export interface ChannelAdapter {
    sendMessage(...args: any[]): Promise<any>;
    sendTemplate?(...args: any[]): Promise<any>;
}

import { ConversationContext } from './models/whatsapp/ConversationContext.js';
import { IWhatsAppProvider } from './interfaces/whatsapp/index.js';

export function createWhatsAppAdapter(provider: IWhatsAppProvider) {
    async function sendMessage(
        context: ConversationContext,
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<string> {
        const result = await provider.sendMessage({
            recipientPhone: context.externalId,
            messageType: 'TEXT',
            textContent: { body: content },
        });
        if (!result.success) {
            throw new Error(result.errorMessage || 'Failed to send WhatsApp message');
        }
        return result.providerMessageId!;
    }

    async function sendTemplate(
        context: ConversationContext,
        templateName: string,
        languageCode: string,
        variables: Record<string, string>
    ): Promise<string> {
        const components = Object.entries(variables).map(([key, value]) => ({
            type: 'body' as const,
            parameters: [{ type: 'text' as const, value }],
        }));
        const result = await provider.sendTemplate(
            context.externalId, templateName, languageCode, components
        );
        if (!result.success) {
            throw new Error(result.errorMessage || 'Failed to send WhatsApp template');
        }
        return result.providerMessageId!;
    }

    async function sendMedia(
        context: ConversationContext,
        url: string,
        caption?: string,
        mediaType: 'image' | 'document' | 'video' | 'audio' = 'image'
    ): Promise<string> {
        const result = await provider.sendMessage({
            recipientPhone: context.externalId,
            messageType: mediaType.toUpperCase() as any,
            mediaContent: {
                mediaId: 'url-reference',
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

    async function sendInteractive(
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

        let result;
        if ('sendInteractive' in provider) {
            result = await (provider as any).sendInteractive(interactiveMessage);
        } else {
            result = await provider.sendMessage({
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

    async function markAsRead(context: ConversationContext, messageId: string): Promise<void> {
        await provider.markAsRead(messageId);
    }

    return { sendMessage, sendTemplate, sendMedia, sendInteractive, markAsRead };
}
