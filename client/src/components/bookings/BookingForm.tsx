import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Card, CardContent, CardFooter } from '@/components/ui';
import { useResources } from '@/hooks';
import type { CreateBookingInput } from '@/types';

const bookingSchema = z.object({
    resourceId: z.string().min(1, 'Resource is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    guestName: z.string().min(1, 'Guest name is required'),
    guestEmail: z.string().email().optional().or(z.literal('')),
    guestPhone: z.string().optional(),
    guestCount: z.coerce.number().min(1),
    baseAmount: z.coerce.number().min(0),
    taxAmount: z.coerce.number().min(0).default(0),
    totalAmount: z.coerce.number().min(0),
    currency: z.string().default('INR'),
    notes: z.string().optional(),
    source: z.enum(['DIRECT', 'OTA', 'MANUAL', 'CSV', 'EMAIL']).default('MANUAL'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
    onSubmit: (data: CreateBookingInput) => void;
    isLoading?: boolean;
    onCancel: () => void;
    initialResourceId?: string;
}

export function BookingForm({ onSubmit, isLoading, onCancel, initialResourceId }: BookingFormProps) {
    const { data: resourcesResponse } = useResources();
    const resources = resourcesResponse?.data || [];

    const form = useForm<BookingFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(bookingSchema) as any,
        defaultValues: {
            resourceId: initialResourceId || '',
            guestCount: 1,
            source: 'MANUAL',
            currency: 'INR',
            baseAmount: 0,
            totalAmount: 0,
        },
    });

    const { register, handleSubmit, formState: { errors } } = form;

    const handleFormSubmit = (data: BookingFormData) => {
        // Convert to strict DTO
        onSubmit({
            ...data,
            guestEmail: data.guestEmail || undefined,
            guestPhone: data.guestPhone || undefined,
            startDate: new Date(data.startDate).toISOString(), // ensure ISO
            endDate: new Date(data.endDate).toISOString(),
        } as CreateBookingInput);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Resource Selection */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Resource</label>
                            <select
                                {...register('resourceId')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Select Resource</option>
                                {resources.map((res) => (
                                    <option key={res.id} value={res.id}>
                                        {res.name} ({res.type})
                                    </option>
                                ))}
                            </select>
                            {errors.resourceId && (
                                <p className="text-sm text-destructive">{errors.resourceId.message}</p>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Check-in Date</label>
                            <Input type="datetime-local" {...register('startDate')} />
                            {errors.startDate && (
                                <p className="text-sm text-destructive">{errors.startDate.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Check-out Date</label>
                            <Input type="datetime-local" {...register('endDate')} />
                            {errors.endDate && (
                                <p className="text-sm text-destructive">{errors.endDate.message}</p>
                            )}
                        </div>

                        {/* Guest Details */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Guest Name</label>
                            <Input {...register('guestName')} placeholder="John Doe" />
                            {errors.guestName && (
                                <p className="text-sm text-destructive">{errors.guestName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Guests</label>
                            <Input type="number" {...register('guestCount')} min={1} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email (Optional)</label>
                            <Input type="email" {...register('guestEmail')} placeholder="john@example.com" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone (Optional)</label>
                            <Input type="tel" {...register('guestPhone')} placeholder="+1234567890" />
                        </div>

                        {/* Financials */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base Amount</label>
                            <Input type="number" step="0.01" {...register('baseAmount')} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Total Amount</label>
                            <Input type="number" step="0.01" {...register('totalAmount')} />
                            {errors.totalAmount && (
                                <p className="text-sm text-destructive">{errors.totalAmount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source</label>
                            <select {...register('source')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="MANUAL">Manual</option>
                                <option value="DIRECT">Direct</option>
                                <option value="OTA">OTA</option>
                                <option value="EMAIL">Email</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <label className="text-sm font-medium">Notes</label>
                        <textarea
                            {...register('notes')}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-gray-200"
                            placeholder="Special requests or internal notes..."
                        />
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating Booking...' : 'Create Booking'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
