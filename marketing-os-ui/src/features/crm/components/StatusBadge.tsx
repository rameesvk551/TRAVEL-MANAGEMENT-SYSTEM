import type { LeadStatus } from '../data/leads';

const statusColors: Record<LeadStatus, string> = {
    New: 'border-blue-200 bg-blue-50 text-blue-700',
    Contacted: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    Qualified: 'border-purple-200 bg-purple-50 text-purple-700',
    Won: 'border-green-200 bg-green-50 text-green-700',
    Lost: 'border-red-200 bg-red-50 text-red-700',
};

interface StatusBadgeProps {
    status: LeadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColors[status]}`}
        >
            {status}
        </span>
    );
}
