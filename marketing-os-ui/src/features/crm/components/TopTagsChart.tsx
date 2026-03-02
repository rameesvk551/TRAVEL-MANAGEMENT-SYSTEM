import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { LeadRecord } from '../data/leads';

interface TopTagsChartProps {
    leads: LeadRecord[];
}

export function TopTagsChart({ leads }: TopTagsChartProps) {
    const tagMap: Record<string, number> = {};
    for (const lead of leads) {
        for (const tag of lead.tags) {
            tagMap[tag] = (tagMap[tag] || 0) + 1;
        }
    }

    const data = Object.entries(tagMap)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Popular Tags
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} layout="vertical" barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="tag" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip
                        formatter={(value: number | undefined) => [`${value ?? 0} leads`]}
                        contentStyle={{ borderRadius: 12, fontSize: 13 }}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
