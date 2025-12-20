import { apiClient } from './client';

export interface DashboardStats {
    totalResources: number;
    activeBookings: number;
    openLeads: number;
    revenueMTD: number;
    recentBookings: any[];
    pipelineStats: Record<string, number>;
    revenueOverTime: { name: string; amount: number }[];
    leadsBySource: { name: string; count: number }[];
    bookingsByResource: { name: string; count: number }[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
};
