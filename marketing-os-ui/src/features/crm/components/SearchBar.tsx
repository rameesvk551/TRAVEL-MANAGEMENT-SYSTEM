import { Search } from 'lucide-react';
import { LEAD_STATUS_ORDER } from '../data/leads';
import type { LeadStatusFilter } from '../hooks';

interface SearchBarProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    statusFilter: LeadStatusFilter;
    onStatusFilterChange: (value: LeadStatusFilter) => void;
}

export function SearchBar({
    searchTerm,
    onSearchTermChange,
    statusFilter,
    onStatusFilterChange,
}: SearchBarProps) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    placeholder="Search leads by name, email, phone or tags"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
            </label>

            <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value as LeadStatusFilter)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-48"
            >
                <option value="All">All Status</option>
                {LEAD_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                        {status}
                    </option>
                ))}
            </select>
        </div>
    );
}
