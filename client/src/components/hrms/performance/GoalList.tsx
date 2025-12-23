// components/hrms/performance/GoalList.tsx
// Employee goal management list

import { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle,
  Clock,
  Play,
  TrendingUp,
} from 'lucide-react';
import { usePerformanceGoals, useUpdateGoalProgress } from '../../../hooks/hrms/usePerformance';
import type { PerformanceGoal } from '../../../api/hrms/performanceApi';

interface GoalListProps {
  employeeId: string;
  cycleId?: string;
}

export function GoalList({ employeeId, cycleId }: GoalListProps) {
  const { data: goals, isLoading } = usePerformanceGoals({ employeeId, cycleId });
  const updateProgress = useUpdateGoalProgress();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string }> = {
      DRAFT: { icon: <Clock className="w-3 h-3" />, color: 'bg-gray-100 text-gray-600' },
      ACTIVE: { icon: <Play className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
      COMPLETED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700' },
      ON_TRACK: { icon: <TrendingUp className="w-3 h-3" />, color: 'bg-green-100 text-green-700' },
      AT_RISK: { icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700' },
      BEHIND: { icon: <Clock className="w-3 h-3" />, color: 'bg-red-100 text-red-700' },
    };
    const config = configs[status] || configs.DRAFT;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  const handleUpdateProgress = async (goalId: string) => {
    try {
      await updateProgress.mutateAsync({
        id: goalId,
        data: { progressPercentage: progressValue },
      });
      setEditingId(null);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Goals</h2>
          <p className="text-sm text-gray-500 mt-1">Track and manage performance goals</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : goals?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals set</h3>
          <p className="text-gray-500">Create goals to track performance progress</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals?.map((goal: PerformanceGoal) => (
            <div key={goal.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{goal.title}</h3>
                    {getStatusBadge(goal.status)}
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'No deadline'}</span>
                    <span>Weight: {goal.weight}%</span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium">{goal.progress || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${goal.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Update Progress */}
              {editingId === goal.id ? (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progressValue}
                    onChange={(e) => setProgressValue(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded text-center"
                  />
                  <span className="text-gray-500">%</span>
                  <button
                    onClick={() => handleUpdateProgress(goal.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(goal.id);
                    setProgressValue(goal.progress || 0);
                  }}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                >
                  Update Progress
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
