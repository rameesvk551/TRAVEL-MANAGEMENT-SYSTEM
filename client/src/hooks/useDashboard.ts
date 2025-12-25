import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, type DashboardParams } from '../api/dashboardApi';

export function useDashboardStats(params?: DashboardParams) {
    return useQuery({
        queryKey: ['dashboard', 'stats', params?.branchId ?? 'all'],
        queryFn: () => getDashboardStats(params),
        refetchInterval: 60000, // Refresh every minute
    });
}
