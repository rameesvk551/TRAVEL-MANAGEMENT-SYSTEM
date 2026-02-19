import { ChannelAdapter } from '../../application/interfaces/ChannelAdapter.js';
import { ConversationContext } from '../modules/whatsapp/models/ConversationContext';
import axios, { AxiosInstance } from 'axios';

/**
 * InstagramAdapter
 * Handles Instagram Direct Messages via Graph API
 */
export class InstagramAdapter implements ChannelAdapter {
    private client: AxiosInstance;
    private readonly apiVersion = 'v19.0';

    constructor(
        private accessToken: string,
        private pageId: string
    ) {
        this.client = axios.create({
            baseURL: `https://graph.facebook.com/${this.apiVersion}`,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Send a text message to an Instagram user
     */
    async sendMessage(
        context: ConversationContext,
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<string> {
        try {
            if (context.channel !== 'INSTAGRAM') {
                throw new Error(`Invalid channel for InstagramAdapter: ${context.channel}`);
            }

            const response = await this.client.post(`/${this.pageId}/messages`, {
                recipient: { id: context.externalId }, // Instagram Scoped ID (IGSID)
                message: { text: content },
                messaging_type: 'RESPONSE',
            });

            return response.data.message_id;
        } catch (error) {
            console.error('Instagram sendMessage error:', error);
            throw error;
        }
    }

    /**
     * Send a template message
     * Note: Instagram DM doesn't strictly use HSM templates like WhatsApp,
     * but we can implement generic template structures if needed.
     * For now, we'll treat it as standard text or structured messages.
     */
    async sendTemplate(
        context: ConversationContext,
        templateName: string,
        languageCode: string,
        variables: Record<string, string>
    ): Promise<string> {
        // Instagram doesn't have strict templates like WA. 
        // We could fallback to sending text with variable substitution.
        let content = templateName; // Simplified for now

        // Simple substitution
        Object.entries(variables).forEach(([key, value]) => {
            content = content.replace(`{{${key}}}`, value);
        });

        return this.sendMessage(context, content);
    }

    /**
     * Send media attachment
     */
    async sendMedia(
        context: ConversationContext,
        url: string,
        caption?: string,
        mediaType: 'image' | 'document' | 'video' | 'audio' = 'image'
    ): Promise<string> {
        try {
            const payload: any = {
                recipient: { id: context.externalId },
                message: {
                    attachment: {
                        type: mediaType === 'video' ? 'video' : 'image', // IG supports image/video well
                        payload: {
                            url,
                            is_reusable: true
                        }
                    }
                }
            };

            const response = await this.client.post(`/${this.pageId}/messages`, payload);
            return response.data.message_id;
        } catch (error) {
            console.error('Instagram sendMedia error:', error);
            throw error;
        }
    }

    /**
     * Mark message as read
     */
    async markAsRead(
        context: ConversationContext,
        messageId: string
    ): Promise<void> {
        try {
            // Facebook/Instagram "mark_seen" is usually per conversation, not per message
            // But we can target the recipient (sender of the message)
            await this.client.post(`/${this.pageId}/messages`, {
                recipient: { id: context.externalId },
                sender_action: 'mark_seen'
            });
        } catch (error) {
            console.error('Instagram markAsRead error:', error);
            // Don't throw for read receipts failure
        }
    }
}
