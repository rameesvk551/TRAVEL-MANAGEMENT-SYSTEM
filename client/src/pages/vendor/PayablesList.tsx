import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, DollarSign, Eye } from 'lucide-react';
import {
    useVendorPayables,
    useUpdatePayableStatus,
    useApprovePayable,
    usePayablesAgingSummary,
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
import type { VendorPayableStatus } from '@/types/vendor.types';

const statusColors: Record<VendorPayableStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    draft: 'secondary',
    pending_approval: 'warning',
    approved: 'default',
    partially_settled: 'default',
    settled: 'success',
    disputed: 'destructive',
    cancelled: 'secondary',
};

export default function PayablesList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<VendorPayableStatus | ''>('');

    const { data, isLoading, error } = useVendorPayables({
        search: search || undefined,
        status: statusFilter || undefined,
    });

    const { data: agingSummary } = usePayablesAgingSummary();
    const approvePayable = useApprovePayable();

    const payables = data?.data || [];
    const aging = agingSummary?.data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Vendor Payables</h2>
                    <p className="text-muted-foreground">
                        Track and manage amounts owed to vendors
                    </p>
                </div>
            </div>

            {/* Aging Summary */}
            {aging && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-success">Current</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(aging.current || 0)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-warning">1-30 Days</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(aging.days1To30 || 0)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-500">31-60 Days</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(aging.days31To60 || 0)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-destructive">60+ Days</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(aging.days60Plus || 0)}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4">
                <Input
                    placeholder="Search payables..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as VendorPayableStatus | '')}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="partially_settled">Partially Settled</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                        <p className="text-destructive">Error loading payables</p>
                    </CardContent>
                </Card>
            ) : payables.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-1">No payables found</h3>
                        <p className="text-muted-foreground">
                            Payables will appear here when vendor assignments are completed
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {payables.map((payable: any) => (
                        <Card key={payable.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {payable.invoiceNumber || `Payable #${payable.id.slice(0, 8)}`}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {payable.vendorName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={statusColors[payable.status as VendorPayableStatus]}>
                                            {payable.status}
                                        </Badge>
                                        {payable.isOverdue && (
                                            <Badge variant="destructive">Overdue</Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Gross Amount</p>
                                        <p className="font-semibold">{formatCurrency(payable.grossAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Deductions</p>
                                        <p className="font-semibold text-destructive">
                                            -{formatCurrency(payable.totalDeductions || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Net Amount</p>
                                        <p className="font-semibold">{formatCurrency(payable.netAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Due Date</p>
                                        <p className={`font-semibold ${payable.isOverdue ? 'text-destructive' : ''}`}>
                                            {formatDate(payable.dueDate)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/vendors/${payable.vendorId}`)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Vendor
                                    </Button>
                                    {payable.status === 'pending_approval' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                approvePayable.mutate({
                                                    id: payable.id,
                                                    approverId: 'current-user', // TODO: Get from auth
                                                })
                                            }
                                            disabled={approvePayable.isPending}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                    )}
                                    {payable.status === 'approved' && (
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/vendors/settlements/new?payableId=${payable.id}`)}
                                        >
                                            <DollarSign className="h-4 w-4 mr-1" />
                                            Create Settlement
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
