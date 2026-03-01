import React from 'react';
import { CheckCircle2, Circle, Clock, Trash2, Flag } from 'lucide-react';
import type { CrmTask, TaskStatus, TaskPriority } from '../data/tasks';
import { TASK_STATUSES, TASK_PRIORITIES } from '../data/tasks';

const priorityColor: Record<TaskPriority, string> = {
    High: 'text-red-500',
    Medium: 'text-amber-500',
    Low: 'text-gray-400',
};

const statusIcon: Record<TaskStatus, React.ReactNode> = {
    'To Do': <Circle size={16} className="text-gray-400" />,
    'In Progress': <Clock size={16} className="text-blue-500" />,
    Done: <CheckCircle2 size={16} className="text-green-500" />,
};

interface Props {
    byStatus: Record<TaskStatus, CrmTask[]>;
    filterStatus: TaskStatus | 'All';
    filterPriority: TaskPriority | 'All';
    onFilterStatus: (v: TaskStatus | 'All') => void;
    onFilterPriority: (v: TaskPriority | 'All') => void;
    onChangeStatus: (taskId: string, status: TaskStatus) => void;
    onDelete: (taskId: string) => void;
}

export const TaskManager: React.FC<Props> = ({
    byStatus,
    filterStatus,
    filterPriority,
    onFilterStatus,
    onFilterPriority,
    onChangeStatus,
    onDelete,
}) => {
    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3">
                <select
                    value={filterStatus}
                    onChange={(e) => onFilterStatus(e.target.value as TaskStatus | 'All')}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                >
                    <option value="All">All Statuses</option>
                    {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select
                    value={filterPriority}
                    onChange={(e) => onFilterPriority(e.target.value as TaskPriority | 'All')}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                >
                    <option value="All">All Priorities</option>
                    {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </div>

            {/* Columns */}
            <div className="grid grid-cols-3 gap-4">
                {TASK_STATUSES.map((status) => (
                    <div key={status} className="rounded-lg border bg-gray-50 p-3 min-h-[200px]">
                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                            {statusIcon[status]} {status} ({byStatus[status].length})
                        </h4>

                        <div className="space-y-2">
                            {byStatus[status].map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded border bg-white p-2.5 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                        <button
                                            className="shrink-0 text-gray-300 hover:text-red-500"
                                            onClick={() => onDelete(task.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Flag size={11} className={priorityColor[task.priority]} />
                                            {task.priority}
                                        </span>
                                        <span>{task.assignedTo.split(' ')[0]}</span>
                                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>

                                    {/* Quick status change */}
                                    {status !== 'Done' && (
                                        <div className="mt-2 flex gap-1">
                                            {TASK_STATUSES.filter((s) => s !== status).map((s) => (
                                                <button
                                                    key={s}
                                                    className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 hover:bg-indigo-100 hover:text-indigo-600"
                                                    onClick={() => onChangeStatus(task.id, s)}
                                                >
                                                    → {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
