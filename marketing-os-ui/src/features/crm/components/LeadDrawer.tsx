import { useEffect, useState } from 'react';
import { CalendarClock, Mail, Phone, Tag, UserRound, X } from 'lucide-react';
import type { LeadRecord } from '../data/leads';
import type { Activity } from '../data/activities';
import { StatusBadge } from './StatusBadge';
import { ActivityTimeline } from './ActivityTimeline';

interface LeadDrawerProps {
    lead: LeadRecord | null;
    open: boolean;
    notes: string[];
    activities?: Activity[];
    onClose: () => void;
    onAddNote: (note: string) => void;
}

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function LeadDrawer({ lead, open, notes, activities = [], onClose, onAddNote }: LeadDrawerProps) {
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        if (open) {
            setNewNote('');
        }
    }, [open, lead?.id]);

    if (!lead) return null;

    const submitNote = () => {
        const trimmed = newNote.trim();
        if (!trimmed) return;
        onAddNote(trimmed);
        setNewNote('');
    };

    const content = (
        <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">{lead.name}</h3>
                    <p className="text-xs text-slate-500">{lead.id}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close lead drawer"
                >
                    <X className="h-4 w-4" />
                </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Info</span>
                        <StatusBadge status={lead.status} />
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                        <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {lead.phone}
                        </p>
                        <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            {lead.email}
                        </p>
                        <p className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-slate-400" />
                            {lead.assignedTo}
                        </p>
                        <p className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-slate-400" />
                            Last contact: {formatDate(lead.lastContact)}
                        </p>
                    </div>
                </section>

                <section className="space-y-2">
                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Tag className="h-4 w-4" />
                        Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {lead.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </section>

                {activities.length > 0 && (
                    <section className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity Timeline</h4>
                        <ActivityTimeline activities={activities} />
                    </section>
                )}

                <section className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes Timeline</h4>
                    <ul className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                        {notes.map((note, index) => (
                            <li key={`${note}-${index}`} className="flex gap-3 text-sm text-slate-700">
                                <span className="mt-1.5 h-2 w-2 rounded-full bg-slate-400" />
                                <span>{note}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <footer className="space-y-2 border-t border-slate-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add Note</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(event) => setNewNote(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                submitNote();
                            }
                        }}
                        placeholder="Type a note..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                        type="button"
                        onClick={submitNote}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                        Add
                    </button>
                </div>
            </footer>
        </div>
    );

    return (
        <>
            <button
                type="button"
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-slate-950/35 transition-opacity duration-300 ${
                    open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-label="Close lead drawer backdrop"
            />

            <aside
                className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 sm:hidden ${
                    open ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                {content}
            </aside>

            <aside
                className={`fixed right-0 top-0 z-50 hidden h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-300 sm:block ${
                    open ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {content}
            </aside>
        </>
    );
}
