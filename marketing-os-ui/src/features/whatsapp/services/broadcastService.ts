// services/broadcastService.ts
// API calls for WhatsApp broadcast campaigns.

import client from '../../../api/client';

export interface BroadcastPayload {
    templateName: string;
    language: string;
    recipients: Array<{ phone: string; variables?: any }>;
}

export const broadcastService = {
    broadcast: async (payload: BroadcastPayload) => {
        const { data } = await client.post('/whatsapp/broadcast', payload);
        return data;
    },
};
