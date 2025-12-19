import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResources } from '@/hooks';
import { Button, Card, CardContent, CardHeader, CardTitle, CardFooter, Badge, Input } from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { Resource, ResourceType } from '@/types';

const resourceTypeColors: Record<ResourceType, 'default' | 'secondary' | 'success' | 'warning'> = {
    ROOM: 'default',
    TOUR: 'secondary',
    TREK: 'success',
    ACTIVITY: 'warning',
    VEHICLE: 'default',
    EQUIPMENT: 'secondary',
};

import { Edit, Trash2 } from 'lucide-react';
import { useDeleteResource } from '@/hooks';

interface ResourceCardProps {
    resource: Resource;
    onEdit: (id: string) => void;
}

function ResourceCard({ resource, onEdit }: ResourceCardProps) {
    const deleteResource = useDeleteResource();

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <Badge variant={resourceTypeColors[resource.type]}>{resource.type}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {resource.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity: {resource.capacity}</span>
                    <span className="font-semibold">{formatCurrency(resource.basePrice)}</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(resource.id)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this resource?')) {
                            deleteResource.mutate(resource.id);
                        }
                    }}
                    disabled={deleteResource.isPending}
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function Resources() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<ResourceType | ''>('');

    const { data, isLoading, error } = useResources({
        search: search || undefined,
        type: typeFilter || undefined,
    });

    const resources = data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Resources</h2>
                    <p className="text-muted-foreground">
                        Manage your rooms, tours, treks, and equipment
                    </p>
                </div>
                <Button onClick={() => navigate('/resources/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Input
                    placeholder="Search resources..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as ResourceType | '')}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="">All Types</option>
                    <option value="ROOM">Rooms</option>
                    <option value="TOUR">Tours</option>
                    <option value="TREK">Treks</option>
                    <option value="ACTIVITY">Activities</option>
                    <option value="VEHICLE">Vehicles</option>
                    <option value="EQUIPMENT">Equipment</option>
                </select>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading resources...</div>
            ) : error ? (
                <div className="text-center py-12 text-destructive">
                    Failed to load resources. Is the server running?
                </div>
            ) : resources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No resources found. Add your first resource to get started.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {resources.map((resource) => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            onEdit={(id) => navigate(`/resources/${id}/edit`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
