import { useState } from 'react';

export function useLeadNotes(leadIds: string[], defaultNotes: string[]) {
    const [notesByLead, setNotesByLead] = useState<Record<string, string[]>>(() => {
        const seeded: Record<string, string[]> = {};
        leadIds.forEach((leadId) => {
            seeded[leadId] = [...defaultNotes];
        });
        return seeded;
    });

    const addLeadNote = (leadId: string, note: string) => {
        const trimmed = note.trim();
        if (!trimmed) return;

        setNotesByLead((current) => ({
            ...current,
            [leadId]: [...(current[leadId] ?? [...defaultNotes]), trimmed],
        }));
    };

    const getLeadNotes = (leadId: string) => notesByLead[leadId] ?? defaultNotes;

    return {
        addLeadNote,
        getLeadNotes,
    };
}
