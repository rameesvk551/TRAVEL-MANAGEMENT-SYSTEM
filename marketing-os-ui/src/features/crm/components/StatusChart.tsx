import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { LeadStats } from '../hooks/useLeadStats';
import { LEAD_STATUS_ORDER } from '../data/leads';

interface StatusChartProps {
    stats: LeadStats;
}

const STATUS_COLORS: Record<string, string> = {
    New: '#3B82F6',
    Contacted: '#EAB308',
    Qualified: '#8B5CF6',
    Won: '#22C55E',
    Lost: '#EF4444',
};

export function StatusChart({ stats }: StatusChartProps) {
    const data = LEAD_STATUS_ORDER.map((status) => ({
        status,
        count: stats.byStatus[status],
        fill: STATUS_COLORS[status],
    }));

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Leads by Status
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                        formatter={(value: number) => [`${value} leads`]}
                        contentStyle={{ borderRadius: 12, fontSize: 13 }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {data.map((entry) => (
                            <Cell key={entry.status} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
