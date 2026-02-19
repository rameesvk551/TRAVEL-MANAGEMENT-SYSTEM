import client from './client';

export interface IWidgetAgent {
    name: string;
    phone: string;
    role: string;
    avatarUrl?: string;
    isOnline?: boolean;
    schedule?: {
        enabled: boolean;
        days: number[];
        start: string;
        end: string;
    }
}

export interface IWidgetConfig {
    greetingMessage: string;
    btnLabel: string;
    brandColor: string;
    position: 'left' | 'right';
    logoUrl?: string;
    agents: IWidgetAgent[];
    showOfflineMessage: boolean;
    offlineMessage: string;
}

export interface IWidget {
    id: string; // Transformed from _id
    _id?: string;
    name: string;
    config: IWidgetConfig;
    isActive: boolean;
    stats: {
        impressions: number;
        clicks: number;
        conversions: number;
    };
    createdAt: string;
    updatedAt: string;
}

export const widgetApi = {
    getAll: async () => {
        const response = await client.get<IWidget[]>('/growth/widgets');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await client.get<IWidget>(`/growth/widgets/${id}`);
        return response.data;
    },

    create: async (data: Partial<IWidget>) => {
        const response = await client.post<IWidget>('/growth/widgets', data);
        return response.data;
    },

    update: async (id: string, data: Partial<IWidget>) => {
        const response = await client.put<IWidget>(`/growth/widgets/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await client.delete(`/growth/widgets/${id}`);
        return response.data;
    },

    // We might need a method to get script tag code?
    getScriptTag: (widgetId: string) => {
        // TODO: Use env var for hosting URL
        const scriptUrl = `http://localhost:4000/api/v1/growth/pixel.js?widgetId=${widgetId}`;
        return `<script src="${scriptUrl}" async></script>`;
    }
};
