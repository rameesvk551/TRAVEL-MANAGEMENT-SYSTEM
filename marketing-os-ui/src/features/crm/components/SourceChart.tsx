import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { LeadStats } from '../hooks/useLeadStats';

interface SourceChartProps {
    stats: LeadStats;
}

const COLORS: Record<string, string> = {
    Website: '#6366F1',
    WhatsApp: '#22C55E',
    Referral: '#F59E0B',
};

export function SourceChart({ stats }: SourceChartProps) {
    const data = Object.entries(stats.bySource).map(([name, value]) => ({ name, value }));

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Leads by Source
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry) => (
                            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#94A3B8'} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name: string) => [`${value} leads`, name]}
                        contentStyle={{ borderRadius: 12, fontSize: 13 }}
                    />
                    <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
