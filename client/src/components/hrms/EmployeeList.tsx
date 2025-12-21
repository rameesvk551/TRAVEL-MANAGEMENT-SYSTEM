/**
 * Employee List Component
 * Displays paginated list of employees with filters
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployees } from '@/hooks/hrms';
import { Badge, Button, Input, Card, CardHeader, CardContent } from '@/components/ui';
import type { EmployeeStatus, EmployeeType } from '@/types/hrms.types';

const STATUS_COLORS: Record<EmployeeStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
    terminated: 'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<EmployeeType, string> = {
    office: 'Office',
    field: 'Field Staff',
    seasonal: 'Seasonal',
    contract: 'Contract',
};

export function EmployeeList() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useEmployees({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
    });

    if (isLoading) {
        return <div className="p-4">Loading employees...</div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-xl font-semibold">Employees</h2>
                <Link to="/hrms/employees/new">
                    <Button>Add Employee</Button>
                </Link>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    <Input
                        placeholder="Search by name or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Types</option>
                        <option value="office">Office</option>
                        <option value="field">Field Staff</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="contract">Contract</option>
                    </select>
                </div>

                {/* Employee Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">Employee</th>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Joined</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data?.data?.map((employee) => (
                                <tr key={employee.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className="font-medium">
                                                {employee.firstName} {employee.lastName}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {employee.employeeCode}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {TYPE_LABELS[employee.employeeType]}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge className={STATUS_COLORS[employee.status]}>
                                            {employee.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(employee.dateOfJoining).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link to={`/hrms/employees/${employee.id}`}>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data?.pagination && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-500">
                            Showing {data.data?.length} of {data.pagination.total}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= (data.pagination.totalPages || 1)}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
