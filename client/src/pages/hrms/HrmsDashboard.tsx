/**
 * HRMS Dashboard Page
 * Main entry point for HRMS module
 */
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui';

const ROLE_DASHBOARDS = [
    {
        title: 'My Dashboard',
        description: 'Personal view with check-in, trips, and leave balance',
        icon: '📱',
        path: '/hrms/my-dashboard',
        color: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
        subtitle: 'Field Staff',
    },
    {
        title: 'HR Dashboard',
        description: 'Team management, approvals, and payroll status',
        icon: '👔',
        path: '/hrms/hr-dashboard',
        color: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
        subtitle: 'HR Manager',
    },
    {
        title: 'People Insights',
        description: 'Executive view with costs, utilization, and insights',
        icon: '📊',
        path: '/hrms/executive-dashboard',
        color: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
        subtitle: 'Founder/CEO',
    },
];

const HRMS_MODULES = [
    {
        title: 'Employees',
        description: 'Manage employee profiles, documents, and skills',
        icon: '👥',
        path: '/hrms/employees',
        color: 'bg-blue-50 hover:bg-blue-100',
    },
    {
        title: 'Attendance',
        description: 'Check-in/out, view attendance history',
        icon: '🕐',
        path: '/hrms/attendance',
        color: 'bg-green-50 hover:bg-green-100',
    },
    {
        title: 'Leave Management',
        description: 'Apply for leave, view balances',
        icon: '📅',
        path: '/hrms/leaves',
        color: 'bg-yellow-50 hover:bg-yellow-100',
    },
    {
        title: 'Documents',
        description: 'Employee documents, certificates, and permits',
        icon: '📁',
        path: '/hrms/documents',
        color: 'bg-indigo-50 hover:bg-indigo-100',
    },
    {
        title: 'Trip Assignments',
        description: 'View and manage trip assignments',
        icon: '🚌',
        path: '/hrms/trips',
        color: 'bg-purple-50 hover:bg-purple-100',
    },
    {
        title: 'Payroll',
        description: 'View payslips and earnings',
        icon: '💰',
        path: '/hrms/payroll',
        color: 'bg-emerald-50 hover:bg-emerald-100',
    },
    {
        title: 'Team Dashboard',
        description: 'Manager view of team status',
        icon: '📊',
        path: '/hrms/team',
        color: 'bg-orange-50 hover:bg-orange-100',
    },
    {
        title: 'HR Analytics',
        description: 'Workforce metrics and reports',
        icon: '📈',
        path: '/hrms/analytics',
        color: 'bg-pink-50 hover:bg-pink-100',
    },
];

export default function HrmsDashboard() {
    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">HR Management System</h1>
                <p className="text-gray-600 mt-2">
                    Manage employees, attendance, leaves, and payroll
                </p>
            </div>

            {/* Role-Based Dashboards */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Role-Based Dashboards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ROLE_DASHBOARDS.map((dashboard) => (
                        <Link key={dashboard.path} to={dashboard.path}>
                            <div className={`${dashboard.color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">{dashboard.icon}</span>
                                    <div>
                                        <h2 className="text-xl font-semibold">{dashboard.title}</h2>
                                        <span className="text-sm opacity-80">{dashboard.subtitle}</span>
                                    </div>
                                </div>
                                <p className="text-sm opacity-90">{dashboard.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Module Grid */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Modules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {HRMS_MODULES.map((module) => (
                        <Link key={module.path} to={module.path}>
                            <Card className={`${module.color} transition-colors cursor-pointer h-full`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{module.icon}</span>
                                        <h2 className="text-lg font-semibold">{module.title}</h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-sm text-gray-600">{module.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        to="/hrms/attendance/check-in"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        🕐 Check In / Out
                    </Link>
                    <Link
                        to="/hrms/leaves/apply"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        📝 Apply Leave
                    </Link>
                    <Link
                        to="/hrms/payroll/latest"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        💰 View Payslip
                    </Link>
                    <Link
                        to="/hrms/employees/new"
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                    >
                        ➕ Add Employee
                    </Link>
                </div>
            </div>
        </div>
    );
}
