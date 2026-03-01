import { useMemo, useState } from 'react';
import type { LeadRecord, LeadStatus } from '../data/leads';

export type LeadStatusFilter = LeadStatus | 'All';

export function useLeadFilters(leads: LeadRecord[]) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>('All');

    const searchedLeads = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return leads;

        return leads.filter((lead) => {
            const matchesField =
                lead.name.toLowerCase().includes(query) ||
                lead.phone.toLowerCase().includes(query) ||
                lead.email.toLowerCase().includes(query) ||
                lead.assignedTo.toLowerCase().includes(query) ||
                lead.source.toLowerCase().includes(query);

            const matchesTag = lead.tags.some((tag) => tag.toLowerCase().includes(query));
            return matchesField || matchesTag;
        });
    }, [leads, searchTerm]);

    const filteredLeads = useMemo(() => {
        if (statusFilter === 'All') return searchedLeads;
        return searchedLeads.filter((lead) => lead.status === statusFilter);
    }, [searchedLeads, statusFilter]);

    return {
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        filteredLeads,
    };
}
