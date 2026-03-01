import React from 'react';
import { Trash2, UserCheck, ArrowRightCircle, X } from 'lucide-react';
import type { LeadStatus } from '../data/leads';
import { LEAD_STATUS_ORDER } from '../data/leads';

const AGENTS = ['Riya Sharma', 'Kabir Anand', 'Arjun Das', 'Meera Joshi'];

interface Props {
    count: number;
    onClear: () => void;
    onBulkStatusChange: (status: LeadStatus) => void;
    onBulkAssign: (agent: string) => void;
    onBulkDelete: () => void;
}

export const BulkActionBar: React.FC<Props> = ({
    count,
    onClear,
    onBulkStatusChange,
    onBulkAssign,
    onBulkDelete,
}) => {
    const [showStatus, setShowStatus] = React.useState(false);
    const [showAssign, setShowAssign] = React.useState(false);

    if (count === 0) return null;

    return (
        <div className="flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2 text-sm">
            <span className="font-semibold text-indigo-700">{count} selected</span>

            {/* Status dropdown */}
            <div className="relative">
                <button
                    className="flex items-center gap-1 rounded bg-white px-3 py-1 border border-indigo-200 hover:bg-indigo-100 text-indigo-700"
                    onClick={() => { setShowStatus(!showStatus); setShowAssign(false); }}
                >
                    <ArrowRightCircle size={14} /> Move to
                </button>
                {showStatus && (
                    <ul className="absolute left-0 top-full z-10 mt-1 w-36 rounded border bg-white shadow-lg">
                        {LEAD_STATUS_ORDER.map((s) => (
                            <li key={s}>
                                <button
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-indigo-50"
                                    onClick={() => { onBulkStatusChange(s); setShowStatus(false); }}
                                >
                                    {s}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Assign dropdown */}
            <div className="relative">
                <button
                    className="flex items-center gap-1 rounded bg-white px-3 py-1 border border-indigo-200 hover:bg-indigo-100 text-indigo-700"
                    onClick={() => { setShowAssign(!showAssign); setShowStatus(false); }}
                >
                    <UserCheck size={14} /> Assign
                </button>
                {showAssign && (
                    <ul className="absolute left-0 top-full z-10 mt-1 w-44 rounded border bg-white shadow-lg">
                        {AGENTS.map((a) => (
                            <li key={a}>
                                <button
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-indigo-50"
                                    onClick={() => { onBulkAssign(a); setShowAssign(false); }}
                                >
                                    {a}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Delete */}
            <button
                className="flex items-center gap-1 rounded bg-red-50 px-3 py-1 border border-red-200 text-red-600 hover:bg-red-100"
                onClick={onBulkDelete}
            >
                <Trash2 size={14} /> Delete
            </button>

            {/* Clear selection */}
            <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={onClear}>
                <X size={16} />
            </button>
        </div>
    );
};
