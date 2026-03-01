import { useCallback, useState } from 'react';
import type { LeadRecord, LeadStatus } from '../data/leads';
import { leads as seedLeads } from '../data/leads';

let nextId = seedLeads.length + 1001;

export function useLeadStore() {
    const [leads, setLeads] = useState<LeadRecord[]>(seedLeads);

    const addLead = useCallback((draft: Omit<LeadRecord, 'id'>) => {
        const id = `LD-${nextId++}`;
        setLeads((prev) => [{ ...draft, id }, ...prev]);
        return id;
    }, []);

    const updateLeadStatus = useCallback((id: string, status: LeadStatus) => {
        setLeads((prev) =>
            prev.map((l) => (l.id === id ? { ...l, status } : l)),
        );
    }, []);

    const deleteLead = useCallback((id: string) => {
        setLeads((prev) => prev.filter((l) => l.id !== id));
    }, []);

    const bulkUpdateStatus = useCallback((ids: string[], status: LeadStatus) => {
        setLeads((prev) =>
            prev.map((l) => (ids.includes(l.id) ? { ...l, status } : l)),
        );
    }, []);

    const bulkDelete = useCallback((ids: string[]) => {
        setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
    }, []);

    const bulkAssign = useCallback((ids: string[], assignedTo: string) => {
        setLeads((prev) =>
            prev.map((l) => (ids.includes(l.id) ? { ...l, assignedTo } : l)),
        );
    }, []);

    return {
        leads,
        addLead,
        updateLeadStatus,
        deleteLead,
        bulkUpdateStatus,
        bulkDelete,
        bulkAssign,
    };
}
