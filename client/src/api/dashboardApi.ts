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

export interface DashboardParams {
    branchId?: string | null;
}

export const getDashboardStats = async (params?: DashboardParams): Promise<DashboardStats> => {
    const queryParams = new URLSearchParams();
    if (params?.branchId) {
        queryParams.append('branchId', params.branchId);
    }
    const queryString = queryParams.toString();
    const url = queryString ? `/dashboard/stats?${queryString}` : '/dashboard/stats';
    const response = await apiClient.get<DashboardStats>(url);
    return response.data;
};
