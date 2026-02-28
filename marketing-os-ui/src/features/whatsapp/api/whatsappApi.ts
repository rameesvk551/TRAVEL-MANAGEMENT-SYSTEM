// features/whatsapp/api/whatsappApi.ts
// All WhatsApp REST API calls — self-contained in the whatsapp module.

import client from '../../../api/client';

export const whatsappApi = {
    // ── Conversations ──
    getConversations: async (filters?: { state?: string; phone?: string; limit?: number; offset?: number }) => {
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

    // ── Templates ──
    getTemplates: async (filters?: { category?: string; status?: string }) => {
        const { data } = await client.get('/whatsapp/templates', { params: filters });
        return data;
    },
    getTemplate: async (id: string) => {
        const { data } = await client.get(`/whatsapp/templates/${id}`);
        return data;
    },
    createTemplate: async (template: any) => {
        const { data } = await client.post('/whatsapp/templates', template);
        return data;
    },
    updateTemplate: async (id: string, updates: any) => {
        const { data } = await client.put(`/whatsapp/templates/${id}`, updates);
        return data;
    },
    deleteTemplate: async (id: string) => {
        const { data } = await client.delete(`/whatsapp/templates/${id}`);
        return data;
    },
    submitTemplate: async (id: string) => {
        const { data } = await client.post(`/whatsapp/templates/${id}/submit`);
        return data;
    },
    testTemplate: async (id: string, phone: string, variables: any) => {
        const { data } = await client.post(`/whatsapp/templates/${id}/test`, { phone, variables });
        return data;
    },
    syncTemplates: async () => {
        const { data } = await client.post('/whatsapp/templates/sync');
        return data;
    },
    getCategories: async () => {
        const { data } = await client.get('/whatsapp/templates/categories');
        return data;
    },
    getTriggers: async () => {
        const { data } = await client.get('/whatsapp/templates/triggers');
        return data;
    },

    // ── Broadcasting ──
    broadcast: async (payload: { templateName: string; language: string; recipients: Array<{ phone: string; variables?: any }> }) => {
        const { data } = await client.post('/whatsapp/broadcast', payload);
        return data;
    },

    // ── Analytics ──
    getCampaignStats: async (period?: string) => {
        const { data } = await client.get('/whatsapp/analytics/campaigns', { params: { period } });
        return data;
    },
    getResponseStats: async (period?: string) => {
        const { data } = await client.get('/whatsapp/analytics/response-time', { params: { period } });
        return data;
    },

    // ── Automation (Rules) ──
    getRules: async () => {
        const { data } = await client.get('/whatsapp/automation/rules');
        return data;
    },
    createRule: async (rule: any) => {
        const { data } = await client.post('/whatsapp/automation/rules', rule);
        return data;
    },
    updateRule: async (id: string, rule: any) => {
        const { data } = await client.put(`/whatsapp/automation/rules/${id}`, rule);
        return data;
    },
    deleteRule: async (id: string) => {
        const { data } = await client.delete(`/whatsapp/automation/rules/${id}`);
        return data;
    },

    // ── Opt-in / Contacts ──
    getOptInStatus: async (phone: string) => {
        const { data } = await client.get(`/whatsapp/opt-in/${phone}`);
        return data;
    },
    recordOptIn: async (optIn: any) => {
        const { data } = await client.post('/whatsapp/opt-in', optIn);
        return data;
    },
    updateOptIn: async (phone: string, updates: any) => {
        const { data } = await client.put(`/whatsapp/opt-in/${phone}`, updates);
        return data;
    },
};
