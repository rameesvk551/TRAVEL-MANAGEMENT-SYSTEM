import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import { useVendors, useDeleteVendor, useUpdateVendorStatus } from '@/hooks/vendor';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
    Badge,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui';
import type { Vendor, VendorType, VendorStatus } from '@/types/vendor.types';

const vendorTypeColors: Record<VendorType, 'default' | 'secondary' | 'success' | 'warning'> = {
    transport: 'default',
    hotel: 'secondary',
    equipment: 'success',
    guide: 'warning',
    permit_agent: 'default',
    restaurant: 'secondary',
    activity_provider: 'success',
    other: 'default',
};

const statusColors: Record<VendorStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'destructive',
    pending_verification: 'warning',
    blacklisted: 'destructive',
};

interface VendorCardProps {
    vendor: Vendor;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
}

function VendorCard({ vendor, onEdit, onView }: VendorCardProps) {
    const deleteVendor = useDeleteVendor();

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                        <Badge variant={vendorTypeColors[vendor.type]}>{vendor.type}</Badge>
                        <Badge variant={statusColors[vendor.status]}>{vendor.status}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                    {vendor.primaryContact && (
                        <p className="text-muted-foreground">
                            Contact: {vendor.primaryContact.name} ({vendor.primaryContact.phone})
                        </p>
                    )}
                    {vendor.email && (
                        <p className="text-muted-foreground">Email: {vendor.email}</p>
                    )}
                    {vendor.serviceAreas && vendor.serviceAreas.length > 0 && (
                        <p className="text-muted-foreground">
                            Areas: {vendor.serviceAreas.slice(0, 3).join(', ')}
                            {vendor.serviceAreas.length > 3 && ` +${vendor.serviceAreas.length - 3} more`}
                        </p>
                    )}
                    {vendor.performanceScore !== undefined && (
                        <p className="text-muted-foreground">
                            Performance: {vendor.performanceScore.toFixed(1)}/5.0
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => onView(vendor.id)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(vendor.id)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this vendor?')) {
                            deleteVendor.mutate(vendor.id);
                        }
                    }}
                    disabled={deleteVendor.isPending}
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function VendorList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<VendorType | ''>('');
    const [statusFilter, setStatusFilter] = useState<VendorStatus | ''>('');

    const { data, isLoading, error } = useVendors({
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
    });

    const vendors = data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Vendors</h2>
                    <p className="text-muted-foreground">
                        Manage transport, hotels, guides, and other suppliers
                    </p>
                </div>
                <Button onClick={() => navigate('/vendors/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vendor
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Input
                    placeholder="Search vendors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={typeFilter}
                    onValueChange={(value) => setTypeFilter(value as VendorType | '')}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="permit_agent">Permit Agent</SelectItem>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="activity_provider">Activity Provider</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as VendorStatus | '')}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending_verification">Pending Verification</SelectItem>
                        <SelectItem value="blacklisted">Blacklisted</SelectItem>
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
                        <p className="text-destructive">Error loading vendors</p>
                    </CardContent>
                </Card>
            ) : vendors.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-1">No vendors found</h3>
                        <p className="text-muted-foreground mb-4">
                            Get started by adding your first vendor
                        </p>
                        <Button onClick={() => navigate('/vendors/new')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Vendor
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vendors.map((vendor: Vendor) => (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            onEdit={(id) => navigate(`/vendors/${id}/edit`)}
                            onView={(id) => navigate(`/vendors/${id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
