import { Phone, UserRound } from 'lucide-react';
import type { LeadRecord } from '../data/leads';

interface LeadCardProps {
    lead: LeadRecord;
    onOpenLead: (lead: LeadRecord) => void;
}

export function LeadCard({ lead, onOpenLead }: LeadCardProps) {
    return (
        <article
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => onOpenLead(lead)}
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
    );
}
