import { LeadCard } from './LeadCard';
import { StatusBadge } from './StatusBadge';
import { LEAD_STATUS_ORDER, type LeadRecord } from '../data/leads';

interface KanbanBoardProps {
    leads: LeadRecord[];
    onOpenLead: (lead: LeadRecord) => void;
}

export function KanbanBoard({ leads, onOpenLead }: KanbanBoardProps) {
    return (
        <div className="grid gap-4 lg:grid-cols-5">
            {LEAD_STATUS_ORDER.map((status) => {
                const columnLeads = leads.filter((lead) => lead.status === status);

                return (
                    <section
                        key={status}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm"
                    >
                        <header className="mb-3 flex items-center justify-between">
                            <StatusBadge status={status} />
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                                {columnLeads.length}
                            </span>
                        </header>

                        <div className="space-y-2.5">
                            {columnLeads.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
                                    No leads yet
                                </p>
                            ) : (
                                columnLeads.map((lead) => (
                                    <LeadCard key={lead.id} lead={lead} onOpenLead={onOpenLead} />
                                ))
                            )}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
