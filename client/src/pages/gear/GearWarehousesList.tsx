import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Warehouse,
    MapPin,
    Phone,
    Mail,
    Clock,
    Package,
    Edit,
    MoreHorizontal,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
} from '@/components/ui';
import type { GearWarehouse, WarehouseType } from '@/types/gear.types';

const warehouseTypeLabels: Record<WarehouseType, { label: string; color: string; bgColor: string }> = {
    MAIN: { label: 'Main Warehouse', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    BASE_CAMP: { label: 'Base Camp', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    TRANSIT: { label: 'Transit Hub', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    PARTNER: { label: 'Partner Location', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    MOBILE: { label: 'Mobile Unit', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
};

// Mock data - replace with API hook when available
const mockWarehouses: GearWarehouse[] = [
    {
        id: '1',
        tenantId: 'tenant-1',
        name: 'Main Equipment Center',
        code: 'MEC-001',
        type: 'MAIN',
        address: '123 Adventure Way',
        city: 'Manali',
        state: 'Himachal Pradesh',
        country: 'India',
        postalCode: '175131',
        latitude: 32.2396,
        longitude: 77.1887,
        altitude: 2050,
        contactName: 'Rahul Sharma',
        contactPhone: '+91 98765 43210',
        contactEmail: 'rahul@trekops.com',
        operatingHours: '6:00 AM - 8:00 PM',
        capacity: 500,
        zones: ['A', 'B', 'C', 'D'],
        isActive: true,
        notes: 'Primary gear storage facility',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
    },
    {
        id: '2',
        tenantId: 'tenant-1',
        name: 'Leh Base Camp Store',
        code: 'LBC-001',
        type: 'BASE_CAMP',
        address: 'Near Airport Road',
        city: 'Leh',
        state: 'Ladakh',
        country: 'India',
        postalCode: '194101',
        latitude: 34.1526,
        longitude: 77.5771,
        altitude: 3500,
        contactName: 'Tenzin Dorje',
        contactPhone: '+91 98765 12345',
        contactEmail: 'tenzin@trekops.com',
        operatingHours: '7:00 AM - 6:00 PM',
        capacity: 200,
        zones: ['X', 'Y'],
        isActive: true,
        notes: 'High altitude equipment storage',
        createdAt: '2024-02-15',
        updatedAt: '2024-11-20',
    },
    {
        id: '3',
        tenantId: 'tenant-1',
        name: 'Delhi Transit Hub',
        code: 'DTH-001',
        type: 'TRANSIT',
        address: 'Karol Bagh',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110005',
        contactName: 'Amit Kumar',
        contactPhone: '+91 98123 45678',
        contactEmail: 'amit@trekops.com',
        operatingHours: '24/7',
        capacity: 150,
        zones: ['Transit-1', 'Transit-2'],
        isActive: true,
        notes: 'Equipment staging for transfers',
        createdAt: '2024-03-01',
        updatedAt: '2024-10-15',
    },
];

export default function GearWarehousesList() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<WarehouseType | ''>('');

    // Filter warehouses based on search and type
    const filteredWarehouses = mockWarehouses.filter((warehouse) => {
        const matchesSearch =
            !search ||
            warehouse.name.toLowerCase().includes(search.toLowerCase()) ||
            warehouse.code.toLowerCase().includes(search.toLowerCase()) ||
            warehouse.city.toLowerCase().includes(search.toLowerCase());

        const matchesType = !typeFilter || warehouse.type === typeFilter;

        return matchesSearch && matchesType;
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Warehouses</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your gear storage locations
                    </p>
                </div>
                <Button asChild>
                    <Link to="/gear/warehouses/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Warehouse
                    </Link>
                </Button>
            </div>

            {/* Search & Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, code, or city..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </form>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as WarehouseType | '')}
                            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="">All Types</option>
                            {Object.entries(warehouseTypeLabels).map(([value, { label }]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Warehouse Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredWarehouses.map((warehouse) => {
                    const typeInfo = warehouseTypeLabels[warehouse.type];

                    return (
                        <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
                                            <Warehouse className={`h-5 w-5 ${typeInfo.color}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{warehouse.code}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Type Badge */}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                                    {typeInfo.label}
                                </span>

                                {/* Location */}
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p>{warehouse.address}</p>
                                        <p className="text-muted-foreground">
                                            {warehouse.city}, {warehouse.state}
                                        </p>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{warehouse.contactPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{warehouse.contactEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{warehouse.operatingHours}</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span>Capacity: {warehouse.capacity}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {warehouse.zones.length} zones
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link to={`/gear/warehouses/${warehouse.id}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to={`/gear/warehouses/${warehouse.id}/edit`}>
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredWarehouses.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Warehouses Found</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {search || typeFilter
                                ? 'No warehouses match your search criteria.'
                                : 'Get started by adding your first warehouse.'}
                        </p>
                        <Button asChild>
                            <Link to="/gear/warehouses/new">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Warehouse
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
