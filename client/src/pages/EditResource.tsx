import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ResourceForm } from '@/components/resources';
import { useResource, useUpdateResource } from '@/hooks';
import { Button } from '@/components/ui';
import type { ResourceType } from '@/types';

export default function EditResource() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: response, isLoading: isLoadingResource } = useResource(id!);
    const updateResource = useUpdateResource();

    const resource = response?.data;

    if (isLoadingResource) {
        return <div className="text-center py-12">Loading resource...</div>;
    }

    if (!resource) {
        return <div className="text-center py-12">Resource not found</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/resources')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Edit Resource</h2>
                    <p className="text-muted-foreground">
                        Update details for {resource.name}
                    </p>
                </div>
            </div>

            <ResourceForm
                defaultValues={{
                    name: resource.name,
                    type: resource.type as ResourceType, // Cast assuming backend returns valid type
                    description: resource.description,
                    capacity: resource.capacity,
                    basePrice: Number(resource.basePrice), // Ensure number
                    currency: resource.currency,
                }}
                onSubmit={(data) => {
                    updateResource.mutate(
                        { id: id!, data },
                        {
                            onSuccess: () => navigate('/resources'),
                        }
                    );
                }}
                isLoading={updateResource.isPending}
                onCancel={() => navigate('/resources')}
            />
        </div>
    );
}
