import { Users, Trophy, XCircle, Clock, TrendingUp, Star } from 'lucide-react';
import type { LeadStats } from '../hooks/useLeadStats';

interface StatsBarProps {
    stats: LeadStats;
}

const cards = (s: LeadStats) => [
    { label: 'Total Leads', value: s.total, icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { label: 'Won Rate', value: `${s.wonRate}%`, icon: Trophy, color: 'bg-green-50 text-green-600 border-green-200' },
    { label: 'Lost Rate', value: `${s.lostRate}%`, icon: XCircle, color: 'bg-red-50 text-red-600 border-red-200' },
    { label: 'Qualified', value: `${s.qualifiedRate}%`, icon: Star, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { label: 'In Pipeline', value: s.byStatus.New + s.byStatus.Contacted + s.byStatus.Qualified, icon: TrendingUp, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { label: 'Avg Days Since Contact', value: `${s.avgDaysSinceContact}d`, icon: Clock, color: 'bg-slate-50 text-slate-600 border-slate-200' },
];

export function StatsBar({ stats }: StatsBarProps) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cards(stats).map((card) => (
                <div
                    key={card.label}
                    className={`flex items-center gap-3 rounded-2xl border p-3 shadow-sm ${card.color}`}
                >
                    <card.icon className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium uppercase tracking-wide opacity-70">
                            {card.label}
                        </p>
                        <p className="text-lg font-bold leading-tight">{card.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
