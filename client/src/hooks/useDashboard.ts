import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboardApi';

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: getDashboardStats,
        refetchInterval: 60000, // Refresh every minute
    });
}
