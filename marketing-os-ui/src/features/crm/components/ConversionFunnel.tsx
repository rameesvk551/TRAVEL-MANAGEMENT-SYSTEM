import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { LeadStats } from '../hooks/useLeadStats';

interface ConversionFunnelProps {
    stats: LeadStats;
}

const FUNNEL_COLORS = ['#3B82F6', '#EAB308', '#8B5CF6', '#22C55E'];

export function ConversionFunnel({ stats }: ConversionFunnelProps) {
    const data = [
        { stage: 'New', count: stats.byStatus.New },
        { stage: 'Contacted', count: stats.byStatus.Contacted },
        { stage: 'Qualified', count: stats.byStatus.Qualified },
        { stage: 'Won', count: stats.byStatus.Won },
    ];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Conversion Funnel
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip
                        formatter={(value: number | undefined) => [`${value ?? 0} leads`]}
                        contentStyle={{ borderRadius: 12, fontSize: 13 }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={28}>
                        {data.map((_, idx) => (
                            <Cell key={idx} fill={FUNNEL_COLORS[idx]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
