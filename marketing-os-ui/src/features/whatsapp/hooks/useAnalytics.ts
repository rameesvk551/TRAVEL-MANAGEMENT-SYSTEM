// hooks/useAnalytics.ts
// Queries for the Analytics tab.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';

export function useAnalytics() {
    const [period, setPeriod] = useState('7d');

    const { data: campaignData, isLoading: isCampaignLoading } = useQuery({
        queryKey: ['whatsapp-stats-campaigns', period],
        queryFn: () => analyticsService.getCampaignStats(period),
    });

    const { data: responseData, isLoading: isResponseLoading } = useQuery({
        queryKey: ['whatsapp-stats-response', period],
        queryFn: () => analyticsService.getResponseStats(period),
    });

    return {
        period,
        setPeriod,
        campaignStats: campaignData?.data,
        responseStats: responseData?.data,
        isLoading: isCampaignLoading || isResponseLoading,
    };
}
