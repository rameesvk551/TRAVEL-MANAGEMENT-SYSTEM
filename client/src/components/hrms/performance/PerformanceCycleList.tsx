// components/hrms/performance/PerformanceCycleList.tsx
// List of performance review cycles

import { Link } from 'react-router-dom';
import {
  Plus,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle,
  Play,
} from 'lucide-react';
import { usePerformanceCycles } from '../../../hooks/hrms/usePerformance';

export function PerformanceCycleList() {
  const { data: cycles, isLoading } = usePerformanceCycles();

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string }> = {
      DRAFT: { icon: <Clock className="w-3 h-3" />, color: 'bg-gray-100 text-gray-600' },
      ACTIVE: { icon: <Play className="w-3 h-3" />, color: 'bg-green-100 text-green-700' },
      COMPLETED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
    };
    const config = configs[status] || configs.DRAFT;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Performance Cycles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage performance review cycles</p>
        </div>
        <Link
          to="/hrms/performance/cycles/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Cycle
        </Link>
      </div>

      {/* Cycles List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : cycles?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No performance cycles</h3>
          <p className="text-gray-500 mb-4">Create your first performance review cycle</p>
          <Link
            to="/hrms/performance/cycles/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Cycle
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {cycles?.map((cycle) => (
            <Link
              key={cycle.id}
              to={`/hrms/performance/cycles/${cycle.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{cycle.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(cycle.status)}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
