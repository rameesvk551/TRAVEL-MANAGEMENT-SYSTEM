import type { DragEvent } from 'react';
import { Phone, UserRound } from 'lucide-react';
import type { LeadRecord, LeadStatus } from '../data/leads';
import { LEAD_STATUS_ORDER } from '../data/leads';
import { StatusBadge } from './StatusBadge';
import { useDragKanban } from '../hooks/useDragKanban';

interface DragKanbanBoardProps {
    leads: LeadRecord[];
    onOpenLead: (lead: LeadRecord) => void;
    onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

export function DragKanbanBoard({ leads, onOpenLead, onStatusChange }: DragKanbanBoardProps) {
    const {
        draggingId,
        overColumn,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
    } = useDragKanban(onStatusChange);

    return (
        <div className="grid gap-4 lg:grid-cols-5">
            {LEAD_STATUS_ORDER.map((status) => {
                const columnLeads = leads.filter((l) => l.status === status);
                const isOver = overColumn === status;

                return (
                    <section
                        key={status}
                        className={`min-h-[200px] rounded-2xl border p-3 shadow-sm transition-colors ${
                            isOver
                                ? 'border-blue-400 bg-blue-50/60'
                                : 'border-slate-200 bg-slate-50/80'
                        }`}
                        onDragOver={(e: DragEvent) => {
                            e.preventDefault();
                            handleDragOver(status);
                        }}
                        onDrop={(e: DragEvent) => {
                            e.preventDefault();
                            handleDrop(status);
                        }}
                        onDragLeave={() => handleDragOver(null as unknown as LeadStatus)}
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
                                    Drop leads here
                                </p>
                            ) : (
                                columnLeads.map((lead) => (
                                    <article
                                        key={lead.id}
                                        draggable
                                        onDragStart={() => handleDragStart(lead.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => onOpenLead(lead)}
                                        className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition active:cursor-grabbing ${
                                            draggingId === lead.id
                                                ? 'scale-95 opacity-50'
                                                : 'hover:-translate-y-0.5 hover:shadow-md'
                                        }`}
                                    >
                                        <h4 className="text-sm font-semibold text-slate-900">{lead.name}</h4>
                                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                                            <p className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                {lead.phone}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <UserRound className="h-3.5 w-3.5 text-slate-400" />
                                                {lead.assignedTo}
                                            </p>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {lead.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
