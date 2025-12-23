import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, AlertTriangle, Clock, TrendingUp, FileText } from 'lucide-react';
import {
    useVendorDashboard,
    useVendorComplianceAlerts,
    useOverduePayables,
} from '@/hooks/vendor';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
} from '@/components/ui';
import { formatCurrency } from '@/utils';

export default function VendorDashboard() {
    const navigate = useNavigate();
    const { data: dashboardData, isLoading } = useVendorDashboard();
    const { data: complianceAlerts } = useVendorComplianceAlerts(30);
    const { data: overduePayables } = useOverduePayables();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const dashboard = dashboardData?.data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Vendor Management</h2>
                    <p className="text-muted-foreground">
                        Manage suppliers, contracts, payables, and settlements
                    </p>
                </div>
                <Button onClick={() => navigate('/vendors/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vendor
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard?.totalVendors || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {dashboard?.activeVendors || 0} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payables</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(dashboard?.pendingPayables || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboard?.pendingPayablesCount || 0} invoices
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {formatCurrency(dashboard?.overdueAmount || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {overduePayables?.data?.length || 0} overdue
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month Paid</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(dashboard?.paidThisMonth || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboard?.settlementsThisMonth || 0} settlements
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/vendors/list')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Vendors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            View and manage all vendors
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/vendors/payables')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Payables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Track and manage vendor payables
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/vendors/settlements')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Settlements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Process vendor payments
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/vendors/assignments')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            View vendor assignments to bookings
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Compliance Alerts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Compliance Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {complianceAlerts?.data && complianceAlerts.data.length > 0 ? (
                            <div className="space-y-2">
                                {complianceAlerts.data.slice(0, 5).map((alert: any) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted"
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{alert.vendorName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {alert.documentType} expires {alert.expiryDate}
                                            </p>
                                        </div>
                                        <Badge variant="warning">Expiring</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No compliance alerts at this time
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Overdue Payables */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Overdue Payables
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {overduePayables?.data && overduePayables.data.length > 0 ? (
                            <div className="space-y-2">
                                {overduePayables.data.slice(0, 5).map((payable: any) => (
                                    <div
                                        key={payable.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted"
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{payable.vendorName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Due: {payable.dueDate}
                                            </p>
                                        </div>
                                        <span className="font-semibold text-destructive">
                                            {formatCurrency(payable.netAmount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No overdue payables
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
