/**
 * Leave Overview Table
 * Summary of leave statistics by type
 */
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar } from 'lucide-react';
import { useLeavePendingApprovals } from '@/hooks/hrms';

interface LeaveTypeStats {
  type: string;
  displayName: string;
  taken: number;
  pending: number;
  color: string;
}

export function LeaveOverviewTable() {
  const { data: pendingLeaves } = useLeavePendingApprovals();

  // Calculate pending by type
  const pendingByType: Record<string, number> = {};
  (pendingLeaves?.data || []).forEach(leave => {
    pendingByType[leave.leaveType] = (pendingByType[leave.leaveType] || 0) + 1;
  });

  // Mock data combined with real pending counts
  const leaveStats: LeaveTypeStats[] = [
    { 
      type: 'casual', 
      displayName: 'Casual Leave', 
      taken: 42, 
      pending: pendingByType['casual'] || 5,
      color: 'bg-blue-100 text-blue-700',
    },
    { 
      type: 'sick', 
      displayName: 'Sick Leave', 
      taken: 18, 
      pending: pendingByType['sick'] || 2,
      color: 'bg-red-100 text-red-700',
    },
    { 
      type: 'earned', 
      displayName: 'Earned/Paid Leave', 
      taken: 65, 
      pending: pendingByType['earned'] || 8,
      color: 'bg-green-100 text-green-700',
    },
    { 
      type: 'unpaid', 
      displayName: 'Unpaid Leave', 
      taken: 12, 
      pending: pendingByType['unpaid'] || 0,
      color: 'bg-gray-100 text-gray-700',
    },
  ];

  const totalTaken = leaveStats.reduce((sum, s) => sum + s.taken, 0);
  const totalPending = leaveStats.reduce((sum, s) => sum + s.pending, 0);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold text-gray-800">Leave Overview</h2>
        </div>
        <Link 
          to="/hrms/leaves" 
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 text-sm font-medium text-gray-500">Leave Type</th>
              <th className="text-center py-3 text-sm font-medium text-gray-500">Taken</th>
              <th className="text-center py-3 text-sm font-medium text-gray-500">Pending</th>
            </tr>
          </thead>
          <tbody>
            {leaveStats.map((stat) => (
              <tr key={stat.type} className="border-b last:border-b-0">
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${stat.color}`}>
                    {stat.displayName}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span className="font-semibold text-gray-700">{stat.taken}</span>
                </td>
                <td className="py-3 text-center">
                  {stat.pending > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-700 font-semibold text-sm rounded-full">
                      {stat.pending}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td className="py-3 font-semibold text-gray-700">Total</td>
              <td className="py-3 text-center font-bold text-gray-800">{totalTaken}</td>
              <td className="py-3 text-center">
                <span className="inline-flex items-center justify-center px-2 py-1 bg-yellow-100 text-yellow-700 font-bold text-sm rounded-full">
                  {totalPending}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action button */}
      {totalPending > 0 && (
        <Link
          to="/hrms/leaves/approvals"
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg font-medium text-sm transition-colors"
        >
          <span>Review {totalPending} Pending Requests</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
