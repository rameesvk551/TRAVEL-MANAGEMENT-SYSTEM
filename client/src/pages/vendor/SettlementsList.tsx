import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Clock, DollarSign, Eye, XCircle } from 'lucide-react';
import {
    useVendorSettlements,
    useProcessSettlement,
    useApproveSettlement,
    useVoidSettlement,
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
import type { VendorSettlementStatus } from '@/types/vendor.types';

const statusColors: Record<VendorSettlementStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    draft: 'secondary',
    pending_approval: 'warning',
    approved: 'default',
    processing: 'default',
    paid: 'success',
    failed: 'destructive',
    voided: 'secondary',
};

export default function SettlementsList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<VendorSettlementStatus | ''>('');

    const { data, isLoading, error } = useVendorSettlements({
        search: search || undefined,
        status: statusFilter || undefined,
    });

    const processSettlement = useProcessSettlement();
    const approveSettlement = useApproveSettlement();
    const voidSettlement = useVoidSettlement();

    const settlements = data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Vendor Settlements</h2>
                    <p className="text-muted-foreground">
                        Process and track vendor payments
                    </p>
                </div>
                <Button onClick={() => navigate('/vendors/settlements/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Settlement
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Input
                    placeholder="Search settlements..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as VendorSettlementStatus | '')}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="voided">Voided</SelectItem>
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
                        <p className="text-destructive">Error loading settlements</p>
                    </CardContent>
                </Card>
            ) : settlements.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-1">No settlements found</h3>
                        <p className="text-muted-foreground mb-4">
                            Create a new settlement to pay vendor invoices
                        </p>
                        <Button onClick={() => navigate('/vendors/settlements/new')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Settlement
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {settlements.map((settlement: any) => (
                        <Card key={settlement.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {settlement.settlementNumber || `Settlement #${settlement.id.slice(0, 8)}`}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {settlement.vendorName}
                                        </p>
                                    </div>
                                    <Badge variant={statusColors[settlement.status as VendorSettlementStatus]}>
                                        {settlement.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                        <p className="font-semibold">{formatCurrency(settlement.totalAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payables Count</p>
                                        <p className="font-semibold">{settlement.itemsCount || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Method</p>
                                        <p className="font-semibold">{settlement.paymentMethod || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {settlement.status === 'paid' ? 'Paid On' : 'Created On'}
                                        </p>
                                        <p className="font-semibold">
                                            {formatDate(settlement.paidAt || settlement.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/vendors/${settlement.vendorId}`)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Vendor
                                    </Button>
                                    {settlement.status === 'pending_approval' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                approveSettlement.mutate({
                                                    id: settlement.id,
                                                    approverId: 'current-user', // TODO: Get from auth
                                                })
                                            }
                                            disabled={approveSettlement.isPending}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                    )}
                                    {settlement.status === 'approved' && (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                processSettlement.mutate({
                                                    id: settlement.id,
                                                    data: {
                                                        paymentReference: `PAY-${Date.now()}`,
                                                        paymentMethod: 'bank_transfer',
                                                    },
                                                })
                                            }
                                            disabled={processSettlement.isPending}
                                        >
                                            <DollarSign className="h-4 w-4 mr-1" />
                                            Mark as Paid
                                        </Button>
                                    )}
                                    {['draft', 'pending_approval'].includes(settlement.status) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to void this settlement?')) {
                                                    voidSettlement.mutate({
                                                        id: settlement.id,
                                                        reason: 'Cancelled by user',
                                                    });
                                                }
                                            }}
                                            disabled={voidSettlement.isPending}
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Void
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
