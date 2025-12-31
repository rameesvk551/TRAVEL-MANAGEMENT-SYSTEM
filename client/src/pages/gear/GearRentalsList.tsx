import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    DollarSign,
    Calendar,
    User,
    Package,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
} from '@/components/ui';
import type { GearRentalStatus } from '@/types/gear.types';

const statusConfig: Record<GearRentalStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
    QUOTE: { label: 'Quote', color: 'text-gray-500', bgColor: 'bg-gray-500/10', icon: Clock },
    RESERVED: { label: 'Reserved', color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: Calendar },
    ACTIVE: { label: 'Active', color: 'text-green-500', bgColor: 'bg-green-500/10', icon: CheckCircle },
    OVERDUE: { label: 'Overdue', color: 'text-red-500', bgColor: 'bg-red-500/10', icon: AlertTriangle },
    RETURNED: { label: 'Returned', color: 'text-slate-500', bgColor: 'bg-slate-500/10', icon: CheckCircle },
    RETURNED_DAMAGED: { label: 'Returned Damaged', color: 'text-orange-500', bgColor: 'bg-orange-500/10', icon: AlertTriangle },
    EXTENDED: { label: 'Extended', color: 'text-purple-500', bgColor: 'bg-purple-500/10', icon: Clock },
    CANCELLED: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-400/10', icon: XCircle },
    DISPUTED: { label: 'Disputed', color: 'text-red-600', bgColor: 'bg-red-600/10', icon: AlertTriangle },
};

// Mock data - replace with API hook when available
const mockRentals = [
    {
        id: '1',
        rentalNumber: 'RNT-2024-001',
        customerName: 'John Smith',
        status: 'ACTIVE' as GearRentalStatus,
        startDate: '2024-12-20',
        endDate: '2024-12-27',
        totalAmount: 5500,
        depositAmount: 2000,
        itemCount: 5,
    },
    {
        id: '2',
        rentalNumber: 'RNT-2024-002',
        customerName: 'Adventure Tours Co.',
        status: 'RESERVED' as GearRentalStatus,
        startDate: '2024-12-28',
        endDate: '2025-01-05',
        totalAmount: 12000,
        depositAmount: 5000,
        itemCount: 15,
    },
    {
        id: '3',
        rentalNumber: 'RNT-2024-003',
        customerName: 'Sarah Johnson',
        status: 'OVERDUE' as GearRentalStatus,
        startDate: '2024-12-15',
        endDate: '2024-12-22',
        totalAmount: 3200,
        depositAmount: 1500,
        itemCount: 3,
    },
];

export default function GearRentalsList() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<GearRentalStatus | ''>('');

    const filteredRentals = mockRentals.filter((rental) => {
        const matchesSearch =
            !search ||
            rental.rentalNumber.toLowerCase().includes(search.toLowerCase()) ||
            rental.customerName.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !statusFilter || rental.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    // Stats
    const activeCount = mockRentals.filter((r) => r.status === 'ACTIVE').length;
    const overdueCount = mockRentals.filter((r) => r.status === 'OVERDUE').length;
    const totalRevenue = mockRentals
        .filter((r) => ['ACTIVE', 'RETURNED'].includes(r.status))
        .reduce((sum, r) => sum + r.totalAmount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gear Rentals</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage equipment rentals to customers and partners
                    </p>
                </div>
                <Button asChild>
                    <Link to="/gear/rentals/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Rental
                    </Link>
                </Button>
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
                                <p className="text-2xl font-bold">{mockRentals.length}</p>
                                <p className="text-sm text-muted-foreground">Total Rentals</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeCount}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
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
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Revenue</p>
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
                                    placeholder="Search by rental number or customer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </form>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as GearRentalStatus | '')}
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

            {/* Rentals List */}
            <Card>
                <CardHeader>
                    <CardTitle>Rentals</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredRentals.length === 0 ? (
                        <div className="text-center py-12">
                            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Rentals Found</h3>
                            <p className="text-muted-foreground mb-4">
                                {search || statusFilter
                                    ? 'No rentals match your search criteria.'
                                    : 'Get started by creating your first rental.'}
                            </p>
                            <Button asChild>
                                <Link to="/gear/rentals/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Rental
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRentals.map((rental) => {
                                const status = statusConfig[rental.status];
                                const StatusIcon = status.icon;
                                return (
                                    <div
                                        key={rental.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${status.bgColor}`}>
                                                <StatusIcon className={`h-5 w-5 ${status.color}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{rental.rentalNumber}</p>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
                                                    >
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {rental.customerName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Package className="h-3 w-3" />
                                                        {rental.itemCount} items
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-semibold">₹{rental.totalAmount.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Deposit: ₹{rental.depositAmount.toLocaleString()}
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/gear/rentals/${rental.id}`}>View</Link>
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
