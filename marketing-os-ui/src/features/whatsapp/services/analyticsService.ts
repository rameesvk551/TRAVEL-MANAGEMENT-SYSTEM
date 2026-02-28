// services/analyticsService.ts
// API calls for WhatsApp analytics.

import client from '../../../api/client';

export const analyticsService = {
    getCampaignStats: async (period?: string) => {
        const { data } = await client.get('/whatsapp/analytics/campaigns', { params: { period } });
        return data;
    },

    getResponseStats: async (period?: string) => {
        const { data } = await client.get('/whatsapp/analytics/response-time', { params: { period } });
        return data;
    },
};
