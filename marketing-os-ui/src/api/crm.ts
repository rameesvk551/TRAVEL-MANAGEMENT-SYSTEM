import api from './client';

export interface Contact {
    id: string;
    tenantId: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export const crmApi = {
    getContacts: async (params?: any) => {
        const response = await api.get('/crm/contacts', { params });
        return response.data;
    },
    getContact: async (id: string) => {
        const response = await api.get(`/crm/contacts/${id}`);
        return response.data;
    },
    createContact: async (data: Partial<Contact>) => {
        const response = await api.post('/crm/contacts', data);
        return response.data;
    },
    updateContact: async (id: string, data: Partial<Contact>) => {
        const response = await api.put(`/crm/contacts/${id}`, data);
        return response.data;
    },
    deleteContact: async (id: string) => {
        const response = await api.delete(`/crm/contacts/${id}`);
        return response.data;
    }
};
