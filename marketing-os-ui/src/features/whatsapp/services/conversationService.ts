// services/conversationService.ts
// API calls for WhatsApp conversations & messages.

import client from '../../../api/client';

export interface ConversationFilters {
    state?: string;
    phone?: string;
    limit?: number;
    offset?: number;
}

export const conversationService = {
    getConversations: async (filters?: ConversationFilters) => {
        const { data } = await client.get('/whatsapp/conversations', { params: filters });
        return data;
    },

    getConversation: async (id: string) => {
        const { data } = await client.get(`/whatsapp/conversations/${id}`);
        return data;
    },

    getMessages: async (id: string) => {
        const { data } = await client.get(`/whatsapp/conversations/${id}/messages`);
        return data;
    },

    sendMessage: async (conversationId: string, text: string, recipientPhone?: string) => {
        const { data } = await client.post(`/whatsapp/conversations/${conversationId}/send`, { text, recipientPhone });
        return data;
    },

    sendTemplate: async (recipientPhone: string, templateName: string, language: string, variables: any) => {
        const { data } = await client.post('/whatsapp/messages/template', { recipientPhone, templateName, language, variables });
        return data;
    },

    sendConversationTemplate: async (conversationId: string, templateName: string, language: string = 'en', variables: any = {}) => {
        const { data } = await client.post(`/whatsapp/conversations/${conversationId}/send-template`, { templateName, language, variables });
        return data;
    },

    assignOperator: async (conversationId: string, userId: string) => {
        const { data } = await client.post(`/whatsapp/conversations/${conversationId}/assign`, { userId });
        return data;
    },

    escalateConversation: async (conversationId: string, reason: string) => {
        const { data } = await client.post(`/whatsapp/conversations/${conversationId}/escalate`, { reason });
        return data;
    },

    closeConversation: async (conversationId: string) => {
        const { data } = await client.post(`/whatsapp/conversations/${conversationId}/close`);
        return data;
    },

    startNewChat: async (phoneNumber: string, displayName?: string) => {
        const { data } = await client.post('/whatsapp/conversations/new', { phoneNumber, displayName });
        return data;
    },
};
