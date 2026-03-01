import React from 'react';
import { Phone, Mail, MessageCircle, Users, StickyNote } from 'lucide-react';
import type { Activity, ActivityType } from '../data/activities';

const iconMap: Record<ActivityType, React.ReactNode> = {
    call: <Phone size={16} />,
    email: <Mail size={16} />,
    whatsapp: <MessageCircle size={16} />,
    meeting: <Users size={16} />,
    note: <StickyNote size={16} />,
};

const colorMap: Record<ActivityType, string> = {
    call: 'bg-blue-100 text-blue-600',
    email: 'bg-amber-100 text-amber-600',
    whatsapp: 'bg-green-100 text-green-600',
    meeting: 'bg-purple-100 text-purple-600',
    note: 'bg-gray-100 text-gray-600',
};

interface Props {
    activities: Activity[];
}

export const ActivityTimeline: React.FC<Props> = ({ activities }) => {
    if (activities.length === 0) {
        return <p className="text-sm text-gray-400 py-4 text-center">No activities yet.</p>;
    }

    return (
        <ol className="relative border-l border-gray-200 ml-3 space-y-4">
            {activities.map((a) => {
                const date = new Date(a.timestamp);
                return (
                    <li key={a.id} className="ml-6">
                        {/* dot */}
                        <span
                            className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${colorMap[a.type]}`}
                        >
                            {iconMap[a.type]}
                        </span>

                        <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    {a.type}
                                </span>
                                <time className="text-xs text-gray-400">
                                    {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </time>
                            </div>
                            <p className="text-sm text-gray-700">{a.description}</p>
                            <p className="mt-1 text-xs text-gray-400">by {a.agent}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
};
