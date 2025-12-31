import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Wrench,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    Package,
    User,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
} from '@/components/ui';
import { useInspectionOverdueItems, useMaintenanceOverdueItems } from '@/hooks/useGear';

type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

const statusConfig: Record<MaintenanceStatus, { label: string; color: string; bgColor: string }> = {
    SCHEDULED: { label: 'Scheduled', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    COMPLETED: { label: 'Completed', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    OVERDUE: { label: 'Overdue', color: 'text-red-500', bgColor: 'bg-red-500/10' },
    CANCELLED: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

// Mock maintenance records - replace with API when available
const mockMaintenanceRecords = [
    {
        id: '1',
        gearItemName: 'Alpine Tent Pro 4P',
        gearItemSku: 'TENT-ALP-001',
        type: 'INSPECTION',
        status: 'SCHEDULED' as MaintenanceStatus,
        scheduledDate: '2024-12-28',
        assignedTo: 'Maintenance Team',
        notes: 'Annual waterproofing check',
    },
    {
        id: '2',
        gearItemName: 'Climbing Rope 60m',
        gearItemSku: 'CLIMB-ROPE-003',
        type: 'SAFETY_CHECK',
        status: 'OVERDUE' as MaintenanceStatus,
        scheduledDate: '2024-12-20',
        assignedTo: 'Safety Officer',
        notes: 'Critical safety inspection required',
    },
    {
        id: '3',
        gearItemName: 'GPS Navigator X5',
        gearItemSku: 'NAV-GPS-002',
        type: 'REPAIR',
        status: 'IN_PROGRESS' as MaintenanceStatus,
        scheduledDate: '2024-12-22',
        assignedTo: 'Tech Support',
        notes: 'Battery replacement and firmware update',
    },
    {
        id: '4',
        gearItemName: 'Sleeping Bag -20°C',
        gearItemSku: 'SLEEP-BAG-007',
        type: 'CLEANING',
        status: 'COMPLETED' as MaintenanceStatus,
        scheduledDate: '2024-12-18',
        completedDate: '2024-12-19',
        assignedTo: 'Cleaning Team',
        notes: 'Deep clean and re-waterproofing',
    },
];

export default function GearMaintenanceList() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    const { data: inspectionOverdue, isLoading: inspectionLoading } = useInspectionOverdueItems();
    const { data: maintenanceOverdue, isLoading: maintenanceLoading } = useMaintenanceOverdueItems();

    const isLoading = inspectionLoading || maintenanceLoading;

    const filteredRecords = mockMaintenanceRecords.filter((record) => {
        const matchesSearch =
            !search ||
            record.gearItemName.toLowerCase().includes(search.toLowerCase()) ||
            record.gearItemSku.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !statusFilter || record.status === statusFilter;
        const matchesType = !typeFilter || record.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    // Stats
    const scheduledCount = mockMaintenanceRecords.filter((r) => r.status === 'SCHEDULED').length;
    const inProgressCount = mockMaintenanceRecords.filter((r) => r.status === 'IN_PROGRESS').length;
    const overdueCount = mockMaintenanceRecords.filter((r) => r.status === 'OVERDUE').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gear Maintenance</h1>
                    <p className="text-muted-foreground mt-1">
                        Track inspections, repairs, and maintenance schedules
                    </p>
                </div>
                <Button asChild>
                    <Link to="/gear/maintenance/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Maintenance
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{scheduledCount}</p>
                                <p className="text-sm text-muted-foreground">Scheduled</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <Wrench className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{inProgressCount}</p>
                                <p className="text-sm text-muted-foreground">In Progress</p>
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
                                <p className="text-2xl font-bold">{overdueCount}</p>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Package className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {(inspectionOverdue?.length || 0) + (maintenanceOverdue?.length || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Items Need Attention</p>
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
                                    placeholder="Search by item name or SKU..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </form>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | '')}
                            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(statusConfig).map(([value, { label }]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="">All Types</option>
                            <option value="INSPECTION">Inspection</option>
                            <option value="SAFETY_CHECK">Safety Check</option>
                            <option value="REPAIR">Repair</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="CALIBRATION">Calibration</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Maintenance Records List */}
            <Card>
                <CardHeader>
                    <CardTitle>Maintenance Records</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-12">
                            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Maintenance Records Found</h3>
                            <p className="text-muted-foreground mb-4">
                                {search || statusFilter || typeFilter
                                    ? 'No records match your search criteria.'
                                    : 'Schedule maintenance for your gear items.'}
                            </p>
                            <Button asChild>
                                <Link to="/gear/maintenance/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Schedule Maintenance
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRecords.map((record) => {
                                const status = statusConfig[record.status];
                                return (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${status.bgColor}`}>
                                                <Wrench className={`h-5 w-5 ${status.color}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{record.gearItemName}</p>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({record.gearItemSku})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                    <span className="capitalize">{record.type.toLowerCase().replace('_', ' ')}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(record.scheduledDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {record.assignedTo}
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
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/gear/maintenance/${record.id}`}>View</Link>
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
