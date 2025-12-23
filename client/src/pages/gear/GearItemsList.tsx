import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Package,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
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
import { useGearItems, useGearCategories } from '@/hooks/useGear';
import type { GearCondition, GearItemFilters } from '@/types/gear.types';

const conditionColors: Record<GearCondition, { bg: string; text: string; label: string }> = {
    NEW: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'New' },
    EXCELLENT: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Excellent' },
    GOOD: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Good' },
    FAIR: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Fair' },
    WORN: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'Worn' },
    CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Critical' },
    UNSAFE: { bg: 'bg-red-600/20', text: 'text-red-600', label: 'UNSAFE' },
    RETIRED: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Retired' },
};

export default function GearItemsList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [page, setPage] = useState(1);

    const filters: GearItemFilters = {
        search: searchParams.get('search') || undefined,
        categoryId: searchParams.get('categoryId') || undefined,
        condition: (searchParams.get('condition') as GearCondition) || undefined,
        isSafetyCritical: searchParams.get('isSafetyCritical') === 'true' ? true : undefined,
        isRentable: searchParams.get('isRentable') === 'true' ? true : undefined,
        inspectionOverdue: searchParams.get('inspectionOverdue') === 'true' ? true : undefined,
    };

    const { data, isLoading } = useGearItems(filters, page, 20);
    const { data: categories } = useGearCategories();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (search) {
            params.set('search', search);
        } else {
            params.delete('search');
        }
        setSearchParams(params);
        setPage(1);
    };

    const handleFilterChange = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        setSearchParams(params);
        setPage(1);
    };

    const items = data?.data ?? [];
    const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gear Items</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your trekking equipment inventory
                    </p>
                </div>
                <Button asChild>
                    <Link to="/gear/items/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Gear
                    </Link>
                </Button>
            </div>

            {/* Search & Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, SKU, or barcode..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit">Search</Button>
                        </form>

                        <div className="flex gap-2 flex-wrap">
                            <select
                                className="px-3 py-2 rounded-md border bg-background text-sm"
                                value={filters.categoryId || ''}
                                onChange={(e) => handleFilterChange('categoryId', e.target.value || null)}
                            >
                                <option value="">All Categories</option>
                                {categories?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="px-3 py-2 rounded-md border bg-background text-sm"
                                value={filters.condition || ''}
                                onChange={(e) => handleFilterChange('condition', e.target.value || null)}
                            >
                                <option value="">All Conditions</option>
                                {Object.entries(conditionColors).map(([key, val]) => (
                                    <option key={key} value={key}>
                                        {val.label}
                                    </option>
                                ))}
                            </select>

                            <Button
                                variant={filters.isSafetyCritical ? 'default' : 'outline'}
                                size="sm"
                                onClick={() =>
                                    handleFilterChange(
                                        'isSafetyCritical',
                                        filters.isSafetyCritical ? null : 'true'
                                    )
                                }
                            >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Safety Critical
                            </Button>

                            <Button
                                variant={filters.inspectionOverdue ? 'default' : 'outline'}
                                size="sm"
                                onClick={() =>
                                    handleFilterChange(
                                        'inspectionOverdue',
                                        filters.inspectionOverdue ? null : 'true'
                                    )
                                }
                            >
                                Inspection Overdue
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Items List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            {data?.total ?? 0} Items
                            {filters.condition && ` (${filters.condition})`}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No gear items found</p>
                            <Button asChild className="mt-4" variant="outline">
                                <Link to="/gear/items/new">Add your first gear item</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium">Item</th>
                                        <th className="text-left py-3 px-4 font-medium">SKU</th>
                                        <th className="text-left py-3 px-4 font-medium">Condition</th>
                                        <th className="text-left py-3 px-4 font-medium">Size</th>
                                        <th className="text-left py-3 px-4 font-medium">Value</th>
                                        <th className="text-left py-3 px-4 font-medium">Status</th>
                                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => {
                                        const condition = conditionColors[item.condition] || conditionColors.GOOD;
                                        return (
                                            <tr key={item.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                            <Package className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium flex items-center gap-2">
                                                                {item.name}
                                                                {item.isSafetyCritical && (
                                                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                                )}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {item.brand} {item.model}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                                        {item.sku}
                                                    </code>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${condition.bg} ${condition.text}`}
                                                    >
                                                        {condition.label}
                                                        <span className="ml-1 text-xs opacity-70">
                                                            ({item.conditionScore}%)
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {item.size || item.sizeValue || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    ₹{item.currentValue?.toLocaleString() || 0}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {item.isActive ? (
                                                        <span className="inline-flex items-center gap-1 text-sm text-green-500">
                                                            <CheckCircle className="h-4 w-4" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                                            <XCircle className="h-4 w-4" />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button asChild size="icon" variant="ghost">
                                                            <Link to={`/gear/items/${item.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="icon" variant="ghost">
                                                            <Link to={`/gear/items/${item.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
