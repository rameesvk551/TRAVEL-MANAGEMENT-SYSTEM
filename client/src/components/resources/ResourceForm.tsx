import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Card, CardContent, CardFooter } from '@/components/ui';
import type { CreateResourceInput } from '@/types';

const resourceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['ROOM', 'TOUR', 'TREK', 'ACTIVITY', 'VEHICLE', 'EQUIPMENT']),
    description: z.string().optional(),
    capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
    basePrice: z.coerce.number().min(0, 'Price must be non-negative'),
    currency: z.string().default('INR'),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface ResourceFormProps {
    defaultValues?: Partial<ResourceFormData>;
    onSubmit: (data: CreateResourceInput) => void;
    isLoading?: boolean;
    onCancel: () => void;
}

export function ResourceForm({ defaultValues, onSubmit, isLoading, onCancel }: ResourceFormProps) {
    const form = useForm<ResourceFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(resourceSchema) as any,
        defaultValues: {
            name: '',
            type: 'ROOM',
            description: '',
            capacity: 1,
            basePrice: 0,
            currency: 'INR',
            ...defaultValues,
        },
    });

    const { register, handleSubmit, formState: { errors } } = form;

    const handleFormSubmit = (data: ResourceFormData) => {
        // attributes is required by CreateResourceInput but optional in form for now
        // We'll add default empty object
        const payload: CreateResourceInput = {
            ...data,
            attributes: {},
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input {...register('name')} placeholder="e.g., Deluxe Room" />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <select
                                {...register('type')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="ROOM">Room</option>
                                <option value="TOUR">Tour</option>
                                <option value="TREK">Trek</option>
                                <option value="ACTIVITY">Activity</option>
                                <option value="VEHICLE">Vehicle</option>
                                <option value="EQUIPMENT">Equipment</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base Price</label>
                            <Input
                                type="number"
                                {...register('basePrice')}
                                placeholder="0.00"
                            />
                            {errors.basePrice && (
                                <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Capacity</label>
                            <Input
                                type="number"
                                {...register('capacity')}
                                placeholder="1"
                            />
                            {errors.capacity && (
                                <p className="text-sm text-destructive">{errors.capacity.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            {...register('description')}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Detailed description..."
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Resource'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
