import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Deal } from '../data/deals';
import { DEAL_STAGES, type DealStage } from '../data/deals';

interface DealValueChartProps {
    deals: Deal[];
}

const STAGE_COLORS: Record<DealStage, string> = {
    Discovery: '#06B6D4',
    Proposal: '#6366F1',
    Negotiation: '#F59E0B',
    'Closed Won': '#22C55E',
    'Closed Lost': '#EF4444',
};

function formatCurrency(value: number): string {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
}

export function DealValueChart({ deals }: DealValueChartProps) {
    const data = DEAL_STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage);
        const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
        return { stage, value: totalValue, count: stageDeals.length };
    });

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Deal Pipeline Value
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                        formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, 'Value']}
                        contentStyle={{ borderRadius: 12, fontSize: 13 }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {data.map((entry) => (
                            <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage as DealStage]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
