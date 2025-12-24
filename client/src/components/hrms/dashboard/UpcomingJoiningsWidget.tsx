/**
 * Upcoming Joinings Widget
 * Shows employees joining soon for onboarding preparation
 */
import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  ChevronRight, 
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useEmployees } from '@/hooks/hrms';

interface UpcomingJoining {
  id: string;
  name: string;
  role: string;
  department: string;
  joiningDate: string;
  onboardingStatus: 'pending' | 'in_progress' | 'completed';
  daysUntilJoining: number;
}

export function UpcomingJoiningsWidget() {
  // Filter employees who are joining soon (in pre-hire status or joining date in future)
  // Could be used to fetch actual upcoming joinings
  const { data: _employeesData } = useEmployees({ status: 'active' });

  // Mock upcoming joinings data (in real app, filter by joining date > today)
  const upcomingJoinings: UpcomingJoining[] = [
    {
      id: '1',
      name: 'Amit Kumar',
      role: 'Guide',
      department: 'Operations',
      joiningDate: '2025-12-26',
      onboardingStatus: 'in_progress',
      daysUntilJoining: 2,
    },
    {
      id: '2',
      name: 'Priya Sharma',
      role: 'Coordinator',
      department: 'Support',
      joiningDate: '2025-12-30',
      onboardingStatus: 'pending',
      daysUntilJoining: 6,
    },
    {
      id: '3',
      name: 'Ravi Patel',
      role: 'Driver',
      department: 'Operations',
      joiningDate: '2026-01-02',
      onboardingStatus: 'pending',
      daysUntilJoining: 9,
    },
  ];

  const getStatusBadge = (status: UpcomingJoining['onboardingStatus']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-green-600 text-xs">
            <CheckCircle className="w-3 h-3" />
            Ready
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 text-blue-600 text-xs">
            <AlertCircle className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-600 text-xs">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const formatJoiningDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (upcomingJoinings.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-800">Upcoming Joinings</h2>
        </div>
        <div className="text-center py-8 text-gray-400">
          <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No upcoming joinings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-800">Upcoming Joinings</h2>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
            {upcomingJoinings.length}
          </span>
        </div>
        <Link 
          to="/hrms/employees?filter=upcoming" 
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {upcomingJoinings.map((employee) => (
          <div
            key={employee.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="font-medium text-gray-800">{employee.name}</div>
                <div className="text-sm text-gray-500">
                  {employee.role} · {employee.department}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-3 h-3" />
                {formatJoiningDate(employee.joiningDate)}
              </div>
              <div className="mt-1">{getStatusBadge(employee.onboardingStatus)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick action for the nearest joining */}
      {upcomingJoinings[0] && upcomingJoinings[0].onboardingStatus !== 'completed' && (
        <Link
          to={`/hrms/employees/${upcomingJoinings[0].id}/onboarding`}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm transition-colors"
        >
          <span>
            Complete Onboarding for {upcomingJoinings[0].name.split(' ')[0]}
          </span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
