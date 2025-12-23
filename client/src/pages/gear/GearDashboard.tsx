import { Link } from 'react-router-dom';
import {
    Package,
    AlertTriangle,
    Wrench,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    Shield,
    Warehouse,
    DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import {
    useInventorySummary,
    useUnsafeGearItems,
    usePendingReturns,
    useInspectionOverdueItems,
} from '@/hooks/useGear';

export default function GearDashboard() {
    const { data: summary, isLoading: summaryLoading } = useInventorySummary();
    const { data: unsafeItems } = useUnsafeGearItems();
    const { data: pendingReturns } = usePendingReturns();
    const { data: inspectionOverdue } = useInspectionOverdueItems();

    const stats = [
        {
            title: 'Total Gear Items',
            value: summary?.totalItems ?? 0,
            icon: Package,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Available',
            value: summary?.available ?? 0,
            icon: CheckCircle,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'In Use / Assigned',
            value: summary?.inUse ?? 0,
            icon: TrendingUp,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'Under Maintenance',
            value: summary?.underMaintenance ?? 0,
            icon: Wrench,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
        },
    ];

    const alerts = [
        {
            title: 'Unsafe Gear',
            count: unsafeItems?.length ?? 0,
            description: 'Items marked as unsafe - immediate action required',
            icon: Shield,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            link: '/gear/items?condition=UNSAFE',
            critical: true,
        },
        {
            title: 'Inspection Overdue',
            count: inspectionOverdue?.length ?? 0,
            description: 'Items past their inspection due date',
            icon: Clock,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            link: '/gear/items?inspectionOverdue=true',
            critical: false,
        },
        {
            title: 'Pending Returns',
            count: pendingReturns?.length ?? 0,
            description: 'Gear assignments awaiting return',
            icon: Package,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            link: '/gear/assignments?pendingReturn=true',
            critical: false,
        },
        {
            title: 'Damaged Items',
            count: summary?.damaged ?? 0,
            description: 'Items requiring repair or assessment',
            icon: XCircle,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
            link: '/gear/items?condition=DAMAGED',
            critical: false,
        },
    ];

    const quickActions = [
        { label: 'View All Gear', href: '/gear/items', icon: Package },
        { label: 'Manage Categories', href: '/gear/categories', icon: Package },
        { label: 'Warehouses', href: '/gear/warehouses', icon: Warehouse },
        { label: 'Trip Assignments', href: '/gear/assignments', icon: TrendingUp },
        { label: 'Rentals', href: '/gear/rentals', icon: DollarSign },
        { label: 'Maintenance', href: '/gear/maintenance', icon: Wrench },
    ];

    if (summaryLoading) {
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
                    <h1 className="text-3xl font-bold">Gear Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Track, maintain, and assign trekking equipment
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link to="/gear/items">View All Gear</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/gear/items/new">Add New Gear</Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Alerts Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Attention Required
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {alerts.map((alert) => (
                            <Link
                                key={alert.title}
                                to={alert.link}
                                className={`block p-4 rounded-lg border transition-colors hover:bg-accent ${
                                    alert.critical && alert.count > 0
                                        ? 'border-red-500 bg-red-500/5'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-full ${alert.bgColor}`}>
                                        <alert.icon className={`h-4 w-4 ${alert.color}`} />
                                    </div>
                                    <span className="text-2xl font-bold">{alert.count}</span>
                                </div>
                                <h3 className="font-medium">{alert.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {alert.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {quickActions.map((action) => (
                            <Button
                                key={action.label}
                                asChild
                                variant="outline"
                                className="h-auto py-4 flex-col gap-2"
                            >
                                <Link to={action.href}>
                                    <action.icon className="h-5 w-5" />
                                    <span className="text-xs">{action.label}</span>
                                </Link>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Status Breakdown */}
            {summary?.byStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle>Inventory Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {Object.entries(summary.byStatus).map(([status, count]) => (
                                <div
                                    key={status}
                                    className="text-center p-3 rounded-lg bg-muted/50"
                                >
                                    <p className="text-2xl font-bold">{count as number}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {status.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Unsafe Items */}
            {unsafeItems && unsafeItems.length > 0 && (
                <Card className="border-red-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <Shield className="h-5 w-5" />
                            Unsafe Gear - Immediate Action Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {unsafeItems.slice(0, 5).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                                >
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            SKU: {item.sku} | Condition: {item.condition}
                                        </p>
                                    </div>
                                    <Button asChild size="sm" variant="destructive">
                                        <Link to={`/gear/items/${item.id}`}>
                                            Review <ArrowRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {unsafeItems.length > 5 && (
                            <Button asChild variant="link" className="mt-4">
                                <Link to="/gear/items?condition=UNSAFE">
                                    View all {unsafeItems.length} unsafe items
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
