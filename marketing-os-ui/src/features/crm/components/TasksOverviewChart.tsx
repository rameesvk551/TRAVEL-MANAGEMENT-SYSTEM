import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CrmTask } from '../data/tasks';
import { TASK_STATUSES } from '../data/tasks';

interface TasksOverviewChartProps {
    tasks: CrmTask[];
}

const STATUS_COLORS: Record<string, string> = {
    'To Do': '#3B82F6',
    'In Progress': '#F59E0B',
    Done: '#22C55E',
};

export function TasksOverviewChart({ tasks }: TasksOverviewChartProps) {
    const data = TASK_STATUSES.map((status) => ({
        name: status,
        value: tasks.filter((t) => t.status === status).length,
    }));

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tasks Overview
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
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94A3B8'} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0} tasks`, name ?? '']}
                        contentStyle={{ borderRadius: 12, fontSize: 13 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
