import { useState } from 'react';
import { X } from 'lucide-react';
import type { LeadRecord, LeadSource, LeadStatus } from '../data/leads';

type LeadDraft = Omit<LeadRecord, 'id'>;

interface AddLeadModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (draft: LeadDraft) => void;
}

const SOURCES: LeadSource[] = ['Website', 'WhatsApp', 'Referral'];
const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
const AGENTS = ['Riya Sharma', 'Kabir Anand', 'Arjun Das', 'Meera Joshi'];

const emptyDraft: LeadDraft = {
    name: '',
    phone: '',
    email: '',
    status: 'New',
    source: 'Website',
    assignedTo: AGENTS[0],
    lastContact: new Date().toISOString().slice(0, 10),
    tags: [],
};

const inputClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

export function AddLeadModal({ open, onClose, onSubmit }: AddLeadModalProps) {
    const [draft, setDraft] = useState<LeadDraft>(emptyDraft);
    const [tagInput, setTagInput] = useState('');

    if (!open) return null;

    const set = <K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) =>
        setDraft((d) => ({ ...d, [key]: value }));

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !draft.tags.includes(tag)) {
            set('tags', [...draft.tags, tag]);
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => set('tags', draft.tags.filter((t) => t !== tag));

    const handleSubmit = () => {
        if (!draft.name.trim() || !draft.phone.trim()) return;
        onSubmit(draft);
        setDraft(emptyDraft);
        setTagInput('');
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-slate-950/40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                    <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                        <h2 className="text-base font-semibold text-slate-900">Add New Lead</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    <div className="space-y-4 p-5">
                        {/* Name + Phone */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Name *</label>
                                <input
                                    className={inputClass}
                                    value={draft.name}
                                    onChange={(e) => set('name', e.target.value)}
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Phone *</label>
                                <input
                                    className={inputClass}
                                    value={draft.phone}
                                    onChange={(e) => set('phone', e.target.value)}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
                            <input
                                className={inputClass}
                                value={draft.email}
                                onChange={(e) => set('email', e.target.value)}
                                placeholder="email@example.com"
                            />
                        </div>

                        {/* Source + Status + Assigned */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Source</label>
                                <select
                                    className={inputClass}
                                    value={draft.source}
                                    onChange={(e) => set('source', e.target.value as LeadSource)}
                                >
                                    {SOURCES.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                                <select
                                    className={inputClass}
                                    value={draft.status}
                                    onChange={(e) => set('status', e.target.value as LeadStatus)}
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Assigned To</label>
                                <select
                                    className={inputClass}
                                    value={draft.assignedTo}
                                    onChange={(e) => set('assignedTo', e.target.value)}
                                >
                                    {AGENTS.map((a) => (
                                        <option key={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Tags</label>
                            <div className="flex gap-2">
                                <input
                                    className={inputClass}
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                    placeholder="Type and press Enter"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Add
                                </button>
                            </div>
                            {draft.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {draft.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-0.5 text-slate-400 hover:text-slate-700"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!draft.name.trim() || !draft.phone.trim()}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
                        >
                            Create Lead
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );
}
