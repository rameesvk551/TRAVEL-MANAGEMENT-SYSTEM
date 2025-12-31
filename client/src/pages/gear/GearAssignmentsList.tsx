import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Search,
    Filter,
    Package,
    User,
    Calendar,
    CheckCircle,
    Clock,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
} from '@/components/ui';
import { usePendingReturns, useOverdueReturns } from '@/hooks/useGear';
import type { GearAssignmentStatus } from '@/types/gear.types';

const statusConfig: Record<GearAssignmentStatus, { label: string; color: string; bgColor: string }> = {
    PLANNED: { label: 'Planned', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
    RESERVED: { label: 'Reserved', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    ISSUED: { label: 'Issued', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    IN_USE: { label: 'In Use', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    RETURNED: { label: 'Returned', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
    PARTIAL_RETURN: { label: 'Partial Return', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    DAMAGED: { label: 'Damaged', color: 'text-red-500', bgColor: 'bg-red-500/10' },
    LOST: { label: 'Lost', color: 'text-red-600', bgColor: 'bg-red-600/10' },
    REPLACED: { label: 'Replaced', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    CANCELLED: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

export default function GearAssignmentsList() {
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');

    const { data: pendingReturns, isLoading: pendingLoading } = usePendingReturns();
    const { data: overdueReturns, isLoading: overdueLoading } = useOverdueReturns();

    const isLoading = pendingLoading || overdueLoading;

    // Combine and filter assignments
    const allAssignments = [
        ...(pendingReturns || []),
        ...(overdueReturns || []),
    ];

    const filteredAssignments = allAssignments.filter((assignment) => {
        const matchesSearch =
            !search ||
            assignment.assignedToName?.toLowerCase().includes(search.toLowerCase()) ||
            assignment.tripId?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !statusFilter || assignment.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gear Assignments</h1>
                    <p className="text-muted-foreground mt-1">
                        Track gear issued to trips and participants
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Package className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allAssignments.length}</p>
                                <p className="text-sm text-muted-foreground">Total Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <ArrowRight className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {allAssignments.filter((a) => a.status === 'ISSUED').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Issued</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <Clock className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingReturns?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Pending Return</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{overdueReturns?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or trip..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </form>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(statusConfig).map(([value, { label }]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Assignments List */}
            <Card>
                <CardHeader>
                    <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAssignments.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Assignments Found</h3>
                            <p className="text-muted-foreground">
                                {search || statusFilter
                                    ? 'No assignments match your search criteria.'
                                    : 'No active gear assignments at the moment.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAssignments.map((assignment) => {
                                const status = statusConfig[assignment.status];
                                return (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-muted rounded-lg">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {assignment.assignedToName || 'Unassigned'}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {assignment.plannedReturnDate
                                                            ? new Date(assignment.plannedReturnDate).toLocaleDateString()
                                                            : 'No return date'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
                                            >
                                                {status.label}
                                            </span>
                                            <Button variant="outline" size="sm">
                                                <ArrowLeft className="h-4 w-4 mr-1" />
                                                Process Return
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
