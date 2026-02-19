import client from './client';

export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    source: string;
}

export interface Campaign {
    id: string;
    name: string;
    type: 'BROADCAST' | 'DRIP' | 'TRIGGERED';
    channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
    status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
    scheduledAt?: string;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    repliedCount: number;
    failedCount: number;
    createdAt: string;
    updatedAt: string;
    steps?: {
        id: string;
        stepOrder: number;
        delay: number;
        content?: string;
        templateId?: string;
        templateParams?: Record<string, string>;
    }[];
}

export interface CreateCampaignDTO {
    name: string;
    type: Campaign['type'];
    channel: Campaign['channel'];
    segmentId?: string;
    templateId?: string;
    content?: string;
    scheduledAt?: string;
    metadata?: Record<string, unknown>;
    tagIds?: string[];
    leadIds?: string[];
    steps?: {
        stepOrder: number;
        delay: number;
        templateId?: string;
        templateParams?: Record<string, string>;
        content?: string;
        metadata?: Record<string, unknown>;
    }[];
}

export interface MarketingStats {
    activeCampaigns: number;
    totalLeads: number;
    messagesSent: number;
    responseRate: number;
}

export const marketingApi = {
    getCampaigns: async () => {
        const response = await client.get<{ campaigns: Campaign[]; total: number }>('/marketing/campaigns');
        return response.data;
    },

    getCampaign: async (id: string) => {
        const response = await client.get<Campaign>(`/marketing/campaigns/${id}`);
        return response.data;
    },

    createCampaign: async (data: CreateCampaignDTO) => {
        const response = await client.post<Campaign>('/marketing/campaigns', data);
        return response.data;
    },

    updateCampaign: async (id: string, data: Partial<CreateCampaignDTO>) => {
        const response = await client.patch<Campaign>(`/marketing/campaigns/${id}`, data);
        return response.data;
    },

    deleteCampaign: async (id: string) => {
        await client.delete(`/marketing/campaigns/${id}`);
    },

    launchCampaign: async (id: string) => {
        const response = await client.post<void>(`/marketing/campaigns/${id}/launch`);
        return response.data;
    },

    getDashboardStats: async () => {
        // Mock stats for now, or implement a real endpoint
        // const response = await client.get<MarketingStats>('/marketing/stats');
        // return response.data;
        return {
            activeCampaigns: 3,
            totalLeads: 1250,
            messagesSent: 4500,
            responseRate: 12.5,
        };
    },

    getLeads: async () => {
        const response = await client.get<{ leads: Lead[] }>('/crm/leads');
        return response.data;
    },

    importLeads: async (leads: any[]) => {
        const response = await client.post<{ leads: Lead[] }>('/crm/leads/bulk', { leads });
        return response.data;
    }
};
