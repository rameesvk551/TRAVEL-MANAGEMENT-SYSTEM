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
        color: 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white',
        subtitle: 'Field Staff',
    },
    {
        title: 'HR Dashboard',
        description: 'Team management, approvals, and payroll status',
        icon: '👔',
        path: '/hrms/hr-dashboard',
        color: 'bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white',
        subtitle: 'HR Manager',
    },
    {
        title: 'People Insights',
        description: 'Executive view with costs, utilization, and insights',
        icon: '📊',
        path: '/hrms/executive-dashboard',
        color: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
        subtitle: 'Founder/CEO',
    },
];

const HRMS_MODULES = [
    {
        title: 'Employees',
        description: 'Manage employee profiles, documents, and skills',
        icon: '👥',
        path: '/hrms/employees',
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
        borderColor: 'border-blue-100',
    },
    {
        title: 'Attendance',
        description: 'Check-in/out, view attendance history',
        icon: '🕐',
        path: '/hrms/attendance',
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
    },
    {
        title: 'Leave Management',
        description: 'Apply for leave, view balances',
        icon: '📅',
        path: '/hrms/leaves',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-50',
        borderColor: 'border-amber-100',
    },
    {
        title: 'Documents',
        description: 'Employee documents, certificates, and permits',
        icon: '📁',
        path: '/hrms/documents',
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-50',
        borderColor: 'border-indigo-100',
    },
    {
        title: 'Trip Assignments',
        description: 'View and manage trip assignments',
        icon: '🚌',
        path: '/hrms/trips',
        iconColor: 'text-violet-600',
        iconBg: 'bg-violet-50',
        borderColor: 'border-violet-100',
    },
    {
        title: 'Payroll',
        description: 'View payslips and earnings',
        icon: '💰',
        path: '/hrms/payroll',
        iconColor: 'text-rose-600',
        iconBg: 'bg-rose-50',
        borderColor: 'border-rose-100',
    },
    {
        title: 'Team Dashboard',
        description: 'Manager view of team status',
        icon: '📊',
        path: '/hrms/team',
        iconColor: 'text-cyan-600',
        iconBg: 'bg-cyan-50',
        borderColor: 'border-cyan-100',
    },
    {
        title: 'HR Analytics',
        description: 'Workforce metrics and reports',
        icon: '📈',
        path: '/hrms/analytics',
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-50',
        borderColor: 'border-orange-100',
    },
];

export default function HrmsDashboard() {
    return (
        <div className="py-6 max-w-full space-y-10">
            {/* Role-Based Dashboards */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                    Role-Based Dashboards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ROLE_DASHBOARDS.map((dashboard) => (
                        <Link key={dashboard.path} to={dashboard.path}>
                            <div className={`${dashboard.color} rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2 duration-300`}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <span className="text-3xl">{dashboard.icon}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{dashboard.title}</h2>
                                        <span className="text-sm font-medium opacity-90 bg-white/20 px-2 py-0.5 rounded-full">{dashboard.subtitle}</span>
                                    </div>
                                </div>
                                <p className="text-sm opacity-90 leading-relaxed">{dashboard.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Module Grid */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                    Modules
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {HRMS_MODULES.map((module) => (
                        <Link key={module.path} to={module.path}>
                            <Card className={`hover:shadow-xl transition-all cursor-pointer h-full border-2 ${module.borderColor} hover:border-transparent bg-white group`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${module.iconBg} ${module.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                            <span className="text-2xl">{module.icon}</span>
                                        </div>
                                        <h2 className="text-lg font-bold text-slate-800">{module.title}</h2>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-500 leading-relaxed">{module.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="relative overflow-hidden bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                    Quick Actions
                </h2>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <Link
                        to="/hrms/attendance/check-in"
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-semibold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1"
                    >
                        🕐 Check In / Out
                    </Link>
                    <Link
                        to="/hrms/leaves/apply"
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 font-semibold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1"
                    >
                        📝 Apply Leave
                    </Link>
                    <Link
                        to="/hrms/payroll/latest"
                        className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 flex items-center gap-2 font-semibold shadow-lg shadow-violet-200 transition-all hover:-translate-y-1"
                    >
                        💰 View Payslip
                    </Link>
                    <Link
                        to="/hrms/employees/new"
                        className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 flex items-center gap-2 font-semibold shadow-lg shadow-amber-200 transition-all hover:-translate-y-1"
                    >
                        ➕ Add Employee
                    </Link>
                </div>
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-40"></div>
            </div>
        </div>
    );
}
