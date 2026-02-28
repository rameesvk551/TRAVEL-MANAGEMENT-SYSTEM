import { useMemo, useState } from 'react';
import { KanbanBoard, LeadDrawer, LeadsTable, SearchBar } from '../components';
import { DEFAULT_LEAD_NOTES, LeadRecord, leads } from '../data/leads';
import { useLeadFilters, useLeadNotes } from '../hooks';

type LeadsViewMode = 'list' | 'kanban';

const viewButtonClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

export function LeadsPage() {
    const [viewMode, setViewMode] = useState<LeadsViewMode>('list');
    const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const {
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        filteredLeads,
    } = useLeadFilters(leads);

    const leadIds = useMemo(() => leads.map((lead) => lead.id), []);
    const { addLeadNote, getLeadNotes } = useLeadNotes(leadIds, DEFAULT_LEAD_NOTES);

    const openLeadDrawer = (lead: LeadRecord) => {
        setSelectedLead(lead);
        setDrawerOpen(true);
    };

    const closeLeadDrawer = () => {
        setDrawerOpen(false);
    };

    const handleAddNote = (note: string) => {
        if (!selectedLead) return;
        addLeadNote(selectedLead.id, note);
    };

    const selectedLeadNotes = selectedLead ? getLeadNotes(selectedLead.id) : DEFAULT_LEAD_NOTES;

    return (
        <section className="min-h-full rounded-2xl bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4 sm:p-6">
            <div className="space-y-4">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
                        <p className="text-sm text-slate-500">Track and manage your CRM pipeline in one place.</p>
                    </div>

                    <div className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={viewButtonClass(viewMode === 'list')}
                        >
                            List View
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={viewButtonClass(viewMode === 'kanban')}
                        >
                            Kanban View
                        </button>
                    </div>
                </header>

                {viewMode === 'list' ? (
                    <SearchBar
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                    />
                ) : null}

                {viewMode === 'list' ? (
                    <LeadsTable
                        leads={filteredLeads}
                        onViewLead={openLeadDrawer}
                        onEditLead={openLeadDrawer}
                        onWhatsAppLead={openLeadDrawer}
                    />
                ) : (
                    <KanbanBoard leads={leads} onOpenLead={openLeadDrawer} />
                )}
            </div>

            <LeadDrawer
                lead={selectedLead}
                open={drawerOpen}
                notes={selectedLeadNotes}
                onClose={closeLeadDrawer}
                onAddNote={handleAddNote}
            />
        </section>
    );
}
