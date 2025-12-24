/**
 * HR Manager Dashboard (Desktop)
 * Comprehensive HR management view
 * Following architecture spec section 8.2
 */
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Briefcase,
  CalendarOff,
  Clock,
  Bell,
  FileText,
  DollarSign,
  UserPlus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { 
  useTeamAttendance,
  useLeavePendingApprovals,
  useEmployees,
} from '@/hooks/hrms';
import { 
  PendingActionsWidget,
  WeeklyAttendanceChart,
  LeaveOverviewTable,
  PayrollStatusWidget,
  UpcomingJoiningsWidget,
} from '@/components/hrms';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange';
}

const COLORS = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
};

function StatCard({ title, value, subtitle, trend, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend >= 0 ? '+' : ''}{trend}% this month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${COLORS[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function HRManagerDashboard() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fetch data
  const { data: employeesData } = useEmployees({ limit: 1000 });
  const { data: todayAttendance } = useTeamAttendance(today.toISOString().split('T')[0]);
  const { data: pendingLeaves } = useLeavePendingApprovals();

  const employees = employeesData?.data || [];
  const attendanceList = todayAttendance?.data || [];
  const pendingLeaveRequests = pendingLeaves?.data || [];

  // Calculate stats
  const totalStaff = employees.length;
  const presentCount = attendanceList.filter(a => a.status === 'present').length;
  const onTripCount = attendanceList.filter(a => a.status === 'on_trip').length;
  const onLeaveCount = attendanceList.filter(a => ['absent', 'half_day'].includes(a.status)).length;
  const presentPercentage = totalStaff > 0 ? ((presentCount / totalStaff) * 100).toFixed(1) : '0';
  const onTripPercentage = totalStaff > 0 ? ((onTripCount / totalStaff) * 100).toFixed(1) : '0';
  const onLeavePercentage = totalStaff > 0 ? ((onLeaveCount / totalStaff) * 100).toFixed(1) : '0';

  // Mock notification count
  const notificationCount = pendingLeaveRequests.length + 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-6 h-6" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Staff"
            value={totalStaff}
            trend={3}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Present Today"
            value={presentCount}
            subtitle={`${presentPercentage}%`}
            icon={<UserCheck className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="On Trip"
            value={onTripCount}
            subtitle={`${onTripPercentage}%`}
            icon={<Briefcase className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="On Leave"
            value={onLeaveCount}
            subtitle={`${onLeavePercentage}%`}
            icon={<CalendarOff className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Pending Actions */}
        <PendingActionsWidget />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyAttendanceChart />
          <LeaveOverviewTable />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingJoiningsWidget />
          <PayrollStatusWidget />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/hrms/employees/new"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">Add Employee</span>
            </Link>
            <Link
              to="/hrms/attendance"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-700">Attendance</span>
            </Link>
            <Link
              to="/hrms/payroll"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium text-gray-700">Run Payroll</span>
            </Link>
            <Link
              to="/hrms/analytics"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-medium text-gray-700">Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
