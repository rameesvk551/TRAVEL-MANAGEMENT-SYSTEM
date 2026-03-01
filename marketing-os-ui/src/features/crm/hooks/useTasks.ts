import { useState, useMemo, useCallback } from 'react';
import type { CrmTask, TaskStatus, TaskPriority } from '../data/tasks';
import { tasks as seedTasks, TASK_STATUSES } from '../data/tasks';

export function useTasks() {
    const [tasks, setTasks] = useState<CrmTask[]>(seedTasks);
    const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');
    const [filterPriority, setFilterPriority] = useState<TaskPriority | 'All'>('All');

    const filtered = useMemo(() => {
        return tasks.filter((t) => {
            if (filterStatus !== 'All' && t.status !== filterStatus) return false;
            if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
            return true;
        });
    }, [tasks, filterStatus, filterPriority]);

    const byStatus = useMemo(() => {
        const map: Record<TaskStatus, CrmTask[]> = {} as Record<TaskStatus, CrmTask[]>;
        for (const s of TASK_STATUSES) map[s] = [];
        for (const t of filtered) map[t.status].push(t);
        return map;
    }, [filtered]);

    const changeStatus = useCallback((taskId: string, status: TaskStatus) => {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    }, []);

    const addTask = useCallback((draft: Omit<CrmTask, 'id'>) => {
        setTasks((prev) => [...prev, { ...draft, id: `T-${String(prev.length + 1).padStart(3, '0')}` }]);
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }, []);

    return {
        tasks: filtered,
        byStatus,
        changeStatus,
        addTask,
        deleteTask,
        filterStatus,
        setFilterStatus,
        filterPriority,
        setFilterPriority,
    };
}
