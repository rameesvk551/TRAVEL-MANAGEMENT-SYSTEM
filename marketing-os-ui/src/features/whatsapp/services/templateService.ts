// services/templateService.ts
// API calls for WhatsApp message templates.

import client from '../../../api/client';

export interface TemplateFilters {
    category?: string;
    status?: string;
}

export const templateService = {
    getTemplates: async (filters?: TemplateFilters) => {
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
};
