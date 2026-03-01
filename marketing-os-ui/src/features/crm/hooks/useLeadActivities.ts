import { useMemo } from 'react';
import type { Activity } from '../data/activities';
import { activities as allActivities } from '../data/activities';

export function useLeadActivities(leadId: string | null) {
    return useMemo(() => {
        if (!leadId) return [];
        return allActivities
            .filter((a) => a.leadId === leadId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [leadId]);
}
