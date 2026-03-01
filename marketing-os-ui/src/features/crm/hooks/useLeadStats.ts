import { useMemo } from 'react';
import type { LeadRecord, LeadStatus, LeadSource } from '../data/leads';
import { LEAD_STATUS_ORDER } from '../data/leads';

export interface LeadStats {
    total: number;
    byStatus: Record<LeadStatus, number>;
    bySource: Record<LeadSource, number>;
    wonRate: number;
    lostRate: number;
    qualifiedRate: number;
    avgDaysSinceContact: number;
}

function daysSince(dateStr: string): number {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function useLeadStats(leads: LeadRecord[]): LeadStats {
    return useMemo(() => {
        const total = leads.length;

        const byStatus = LEAD_STATUS_ORDER.reduce(
            (acc, s) => ({ ...acc, [s]: 0 }),
            {} as Record<LeadStatus, number>,
        );
        const bySource: Record<LeadSource, number> = { Website: 0, WhatsApp: 0, Referral: 0 };

        let totalDays = 0;

        for (const lead of leads) {
            byStatus[lead.status]++;
            bySource[lead.source]++;
            totalDays += daysSince(lead.lastContact);
        }

        const wonRate = total > 0 ? Math.round((byStatus.Won / total) * 100) : 0;
        const lostRate = total > 0 ? Math.round((byStatus.Lost / total) * 100) : 0;
        const qualifiedRate = total > 0 ? Math.round((byStatus.Qualified / total) * 100) : 0;
        const avgDaysSinceContact = total > 0 ? Math.round(totalDays / total) : 0;

        return { total, byStatus, bySource, wonRate, lostRate, qualifiedRate, avgDaysSinceContact };
    }, [leads]);
}
