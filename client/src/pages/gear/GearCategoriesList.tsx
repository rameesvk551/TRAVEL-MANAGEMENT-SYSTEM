import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronRight, Shield, Package } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
} from '@/components/ui';
import { useGearCategories, useDeleteGearCategory } from '@/hooks/useGear';
import type { GearCategory, GearCategoryType } from '@/types/gear.types';

const categoryTypeLabels: Record<GearCategoryType, string> = {
    SHELTER: 'Shelter & Tents',
    SLEEPING: 'Sleeping Gear',
    CLOTHING: 'Clothing & Apparel',
    CLIMBING: 'Climbing Equipment',
    SAFETY: 'Safety Equipment',
    NAVIGATION: 'Navigation & GPS',
    COOKING: 'Cooking & Kitchen',
    LIGHTING: 'Lighting',
    TRANSPORT: 'Transport & Bags',
    TECHNICAL: 'Technical Gear',
    COMMUNICATION: 'Communication',
    MEDICAL: 'Medical & First Aid',
    FURNITURE: 'Camp Furniture',
    POWER: 'Power & Batteries',
    OTHER: 'Other',
};

export default function GearCategoriesList() {
    const { data: categories, isLoading } = useGearCategories();
    const deleteCategory = useDeleteGearCategory();
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

    const toggleType = (type: string) => {
        const newExpanded = new Set(expandedTypes);
        if (newExpanded.has(type)) {
            newExpanded.delete(type);
        } else {
            newExpanded.add(type);
        }
        setExpandedTypes(newExpanded);
    };

    // Group categories by type
    const categoriesByType = (categories || []).reduce((acc, cat) => {
        if (!acc[cat.type]) {
            acc[cat.type] = [];
        }
        acc[cat.type].push(cat);
        return acc;
    }, {} as Record<string, GearCategory[]>);

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            try {
                await deleteCategory.mutateAsync(id);
            } catch (error) {
                console.error('Failed to delete category:', error);
            }
        }
    };

    if (isLoading) {
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
                    <h1 className="text-3xl font-bold">Gear Categories</h1>
                    <p className="text-muted-foreground mt-1">
                        Organize your equipment into categories
                    </p>
                </div>
                <Button asChild>
                    <Link to="/gear/categories/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                    </Link>
                </Button>
            </div>

            {/* Categories by Type */}
            <div className="grid gap-4">
                {Object.entries(categoryTypeLabels).map(([type, label]) => {
                    const typeCategories = categoriesByType[type] || [];
                    if (typeCategories.length === 0) return null;

                    const isExpanded = expandedTypes.has(type);

                    return (
                        <Card key={type}>
                            <CardHeader
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleType(type)}
                            >
                                <CardTitle className="flex items-center justify-between text-lg">
                                    <div className="flex items-center gap-3">
                                        <ChevronRight
                                            className={`h-5 w-5 transition-transform ${
                                                isExpanded ? 'rotate-90' : ''
                                            }`}
                                        />
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                        <span>{label}</span>
                                        <span className="text-sm font-normal text-muted-foreground">
                                            ({typeCategories.length})
                                        </span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            {isExpanded && (
                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        {typeCategories.map((category) => (
                                            <div
                                                key={category.id}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {category.isSafetyCritical && (
                                                        <Shield className="h-4 w-4 text-amber-500" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{category.name}</p>
                                                        {category.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {category.description}
                                                            </p>
                                                        )}
                                                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                                            <span>
                                                                Inspection: {category.inspectionIntervalDays} days
                                                            </span>
                                                            <span>
                                                                Maintenance: {category.maintenanceIntervalDays} days
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button asChild size="icon" variant="ghost">
                                                        <Link to={`/gear/categories/${category.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(category.id, category.name)}
                                                        disabled={deleteCategory.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {Object.keys(categoriesByType).length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground mb-4">No categories found</p>
                        <Button asChild>
                            <Link to="/gear/categories/new">Create your first category</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
