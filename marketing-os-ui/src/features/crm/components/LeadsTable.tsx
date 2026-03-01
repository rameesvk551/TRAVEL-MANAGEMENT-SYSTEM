import { Eye, MessageCircle, Pencil } from 'lucide-react';
import type { LeadRecord } from '../data/leads';
import { StatusBadge } from './StatusBadge';

interface LeadsTableProps {
    leads: LeadRecord[];
    onViewLead: (lead: LeadRecord) => void;
    onEditLead: (lead: LeadRecord) => void;
    onWhatsAppLead: (lead: LeadRecord) => void;
    /* optional bulk-selection support */
    isSelected?: (id: string) => boolean;
    onToggleSelect?: (id: string) => void;
    onSelectAll?: () => void;
    onClearAll?: () => void;
}

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function LeadsTable({ leads, onViewLead, onEditLead, onWhatsAppLead, isSelected, onToggleSelect, onSelectAll, onClearAll }: LeadsTableProps) {
    const selectable = !!(isSelected && onToggleSelect);
    const allChecked = selectable && leads.length > 0 && leads.every((l) => isSelected(l.id));

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {selectable && (
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={() => (allChecked ? onClearAll?.() : onSelectAll?.())}
                                        className="rounded border-slate-300"
                                    />
                                </th>
                            )}
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Assigned To</th>
                            <th className="px-4 py-3">Last Contact</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={selectable ? 8 : 7} className="px-4 py-8 text-center text-slate-500">
                                    No leads match the current filters.
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className={`cursor-pointer transition hover:bg-slate-50 ${selectable && isSelected(lead.id) ? 'bg-indigo-50' : ''}`}
                                    onClick={() => onViewLead(lead)}
                                >
                                    {selectable && (
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected(lead.id)}
                                                onChange={() => onToggleSelect(lead.id)}
                                                className="rounded border-slate-300"
                                            />
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{lead.name}</div>
                                        <div className="text-xs text-slate-500">{lead.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{lead.phone}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{lead.source}</td>
                                    <td className="px-4 py-3 text-slate-700">{lead.assignedTo}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatDate(lead.lastContact)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onViewLead(lead);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onEditLead(lead);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onWhatsAppLead(lead);
                                                }}
                                                className="inline-flex items-center rounded-lg border border-green-200 bg-green-50 p-1.5 text-green-700 transition hover:bg-green-100"
                                                aria-label="Open WhatsApp"
                                            >
                                                <MessageCircle className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
