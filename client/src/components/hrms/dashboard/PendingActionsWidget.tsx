/**
 * Pending Actions Widget
 * Shows pending HR tasks requiring attention
 */
import { Link } from 'react-router-dom';
import {
  Clock,
  ChevronRight,
  AlertTriangle,
  FileText,
  UserX,
  Calendar,
} from 'lucide-react';
import { useLeavePendingApprovals } from '@/hooks/hrms';

interface PendingAction {
  id: string;
  type: 'leave' | 'attendance' | 'assignment' | 'document';
  icon: React.ReactNode;
  title: string;
  count: number;
  link: string;
  urgency: 'high' | 'medium' | 'low';
}

export function PendingActionsWidget() {
  const { data: pendingLeaves } = useLeavePendingApprovals();
  
  // Mock data for demonstration (replace with real API calls)
  const pendingActions: PendingAction[] = [
    {
      id: '1',
      type: 'leave' as const,
      icon: <Calendar className="w-5 h-5" />,
      title: 'Leave Requests awaiting approval',
      count: pendingLeaves?.data?.length || 5,
      link: '/hrms/leaves/approvals',
      urgency: 'high' as const,
    },
    {
      id: '2',
      type: 'attendance' as const,
      icon: <Clock className="w-5 h-5" />,
      title: 'Attendance overrides pending',
      count: 3,
      link: '/hrms/attendance/overrides',
      urgency: 'medium' as const,
    },
    {
      id: '3',
      type: 'assignment' as const,
      icon: <UserX className="w-5 h-5" />,
      title: 'Staff without confirmed December trips',
      count: 2,
      link: '/hrms/trips/unassigned',
      urgency: 'low' as const,
    },
    {
      id: '4',
      type: 'document' as const,
      icon: <FileText className="w-5 h-5" />,
      title: 'Documents expiring this month',
      count: 4,
      link: '/hrms/documents?filter=expiring',
      urgency: 'medium' as const,
    },
  ].filter(action => action.count > 0);

  const getUrgencyStyles = (urgency: PendingAction['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'medium':
        return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'low':
        return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const getUrgencyIcon = (urgency: PendingAction['urgency']) => {
    switch (urgency) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
    }
  };

  if (pendingActions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h2 className="font-semibold text-gray-800">Pending Actions</h2>
        <span className="ml-auto px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
          {pendingActions.reduce((sum, a) => sum + a.count, 0)} items
        </span>
      </div>

      <div className="space-y-3">
        {pendingActions.map((action) => (
          <Link
            key={action.id}
            to={action.link}
            className={`
              flex items-center justify-between p-4 rounded-lg border
              hover:shadow-sm transition-all cursor-pointer
              ${getUrgencyStyles(action.urgency)}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getUrgencyIcon(action.urgency)}</span>
              <span className="flex items-center gap-2">
                {action.icon}
                <span className="font-medium">
                  {action.count} {action.title}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              {action.type === 'leave' ? 'View All' : 
               action.type === 'attendance' ? 'Review' : 
               action.type === 'assignment' ? 'Assign' : 'Check'}
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
