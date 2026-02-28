// services/contactService.ts
// API calls for WhatsApp opt-in / contacts.

import client from '../../../api/client';

export const contactService = {
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
