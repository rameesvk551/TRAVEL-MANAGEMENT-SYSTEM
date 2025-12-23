import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle, Clock, MapPin } from 'lucide-react';
import {
    useVendorAssignments,
    useConfirmAssignment,
    useCompleteAssignment,
} from '@/hooks/vendor';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils';
import type { VendorAssignmentStatus } from '@/types/vendor.types';

const statusColors: Record<VendorAssignmentStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    pending: 'warning',
    confirmed: 'default',
    in_progress: 'default',
    completed: 'success',
    cancelled: 'secondary',
    disputed: 'destructive',
};

export default function AssignmentsList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<VendorAssignmentStatus | ''>('');

    const { data, isLoading, error } = useVendorAssignments({
        search: search || undefined,
        status: statusFilter || undefined,
    });

    const confirmAssignment = useConfirmAssignment();
    const completeAssignment = useCompleteAssignment();

    const assignments = data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Vendor Assignments</h2>
                    <p className="text-muted-foreground">
                        Manage vendor assignments to bookings
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Input
                    placeholder="Search assignments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as VendorAssignmentStatus | '')}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-destructive">Error loading assignments</p>
                    </CardContent>
                </Card>
            ) : assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-1">No assignments found</h3>
                        <p className="text-muted-foreground">
                            Vendor assignments will appear here when vendors are assigned to bookings
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment: any) => (
                        <Card key={assignment.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {assignment.serviceType} - {assignment.vendorName}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Booking #{assignment.bookingId?.slice(0, 8)}
                                        </p>
                                    </div>
                                    <Badge variant={statusColors[assignment.status as VendorAssignmentStatus]}>
                                        {assignment.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Service Description</p>
                                        <p className="font-medium">{assignment.serviceDescription || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Service Date</p>
                                        <p className="font-medium">
                                            {formatDate(assignment.serviceDate)}
                                            {assignment.serviceEndDate && ` - ${formatDate(assignment.serviceEndDate)}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Agreed Cost</p>
                                        <p className="font-semibold">{formatCurrency(assignment.agreedCost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Actual Cost</p>
                                        <p className="font-semibold">
                                            {assignment.actualCost ? formatCurrency(assignment.actualCost) : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/vendors/${assignment.vendorId}`)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Vendor
                                    </Button>
                                    {assignment.status === 'pending' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => confirmAssignment.mutate(assignment.id)}
                                            disabled={confirmAssignment.isPending}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Confirm
                                        </Button>
                                    )}
                                    {['confirmed', 'in_progress'].includes(assignment.status) && (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                completeAssignment.mutate({
                                                    id: assignment.id,
                                                    data: { actualCost: assignment.agreedCost },
                                                })
                                            }
                                            disabled={completeAssignment.isPending}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Mark Complete
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
