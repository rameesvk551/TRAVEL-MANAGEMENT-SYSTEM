/**
 * HRMS Dashboard Page
 * Main entry point for HRMS module
 */
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui';

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {HRMS_MODULES.map((module) => (
                    <Link key={module.path} to={module.path}>
                        <Card className={`${module.color} transition-colors cursor-pointer h-full`}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{module.icon}</span>
                                    <h2 className="text-xl font-semibold">{module.title}</h2>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">{module.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        to="/hrms/attendance/check-in"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        🕐 Check In / Out
                    </Link>
                    <Link
                        to="/hrms/leaves/apply"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        📝 Apply Leave
                    </Link>
                    <Link
                        to="/hrms/payroll/latest"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        💰 View Payslip
                    </Link>
                </div>
            </div>
        </div>
    );
}
