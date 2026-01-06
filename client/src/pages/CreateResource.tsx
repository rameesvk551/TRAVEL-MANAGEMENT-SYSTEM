import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ResourceForm } from '@/components/resources';
import { useCreateResource } from '@/hooks';
import { Button } from '@/components/ui';

export default function CreateResource() {
    const navigate = useNavigate();
    const createResource = useCreateResource();

    return (
        <div className="min-h-full bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-5">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate('/resources')}
                        className="rounded-full hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add New Resource</h1>
                        <p className="text-slate-500 mt-1">
                            Register a new room, tour, or equipment to your property inventory.
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
        </div>
    );
}
