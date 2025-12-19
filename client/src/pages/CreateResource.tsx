import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ResourceForm } from '@/components/resources';
import { useCreateResource } from '@/hooks';
import { Button } from '@/components/ui';

export default function CreateResource() {
    const navigate = useNavigate();
    const createResource = useCreateResource();

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/resources')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Add New Resource</h2>
                    <p className="text-muted-foreground">
                        Create a room, tour, or equipment for your inventory
                    </p>
                </div>
            </div>

            <ResourceForm
                onSubmit={(data) => {
                    createResource.mutate(data, {
                        onSuccess: () => navigate('/resources'),
                    });
                }}
                isLoading={createResource.isPending}
                onCancel={() => navigate('/resources')}
            />
        </div>
    );
}
