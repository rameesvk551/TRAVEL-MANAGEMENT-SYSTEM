import { useQuery } from '@tanstack/react-query';
import { crmApi } from '@/api/crmApi';

const LEADS_KEY = 'leads';

export function useLeads(params?: any) {
    return useQuery({
        queryKey: [LEADS_KEY, params],
        queryFn: () => crmApi.getLeads(params),
    });
}
