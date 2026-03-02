import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { LeadRecord } from '../data/leads';

interface AgentPerformanceProps {
    leads: LeadRecord[];
}

const AGENT_COLORS = ['#6366F1', '#F59E0B', '#22C55E', '#EF4444', '#8B5CF6', '#06B6D4'];

export function AgentPerformance({ leads }: AgentPerformanceProps) {
    const agentMap: Record<string, { total: number; won: number }> = {};
    for (const lead of leads) {
        if (!agentMap[lead.assignedTo]) {
            agentMap[lead.assignedTo] = { total: 0, won: 0 };
        }
        agentMap[lead.assignedTo].total++;
        if (lead.status === 'Won') agentMap[lead.assignedTo].won++;
    }

    const data = Object.entries(agentMap)
        .map(([agent, v]) => ({
            agent: agent.split(' ')[0], // first name only
            fullName: agent,
            total: v.total,
            won: v.won,
        }))
        .sort((a, b) => b.total - a.total);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Leads by Agent
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="agent" tick={{ fontSize: 12 }} width={60} />
                    <Tooltip
                        formatter={(value: number | undefined) => [`${value ?? 0} leads`]}
                        contentStyle={{ borderRadius: 12, fontSize: 13 }}
                    />
                    <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={24}>
                        {data.map((_, idx) => (
                            <Cell key={idx} fill={AGENT_COLORS[idx % AGENT_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
