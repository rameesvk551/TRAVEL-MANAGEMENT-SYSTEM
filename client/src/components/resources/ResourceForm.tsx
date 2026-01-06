import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    Button, 
    Input, 
    Card, 
    CardContent, 
    CardFooter,
    Label,
    Textarea,
    Select
} from '@/components/ui';
import { 
    Info, 
    DollarSign, 
    Users, 
    AlignLeft, 
    ChevronRight,
    Loader2
} from 'lucide-react';
import type { CreateResourceInput } from '@/types';
import { cn } from '@/utils';

const resourceSchema = z.object({
    name: z.string().min(1, 'Please give your resource a name'),
    type: z.enum(['ROOM', 'TOUR', 'TREK', 'ACTIVITY', 'VEHICLE', 'EQUIPMENT']),
    description: z.string().optional(),
    capacity: z.coerce.number().min(1, 'Capacity must be at least 1 person'),
    basePrice: z.coerce.number().min(0, 'Price cannot be negative'),
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
        const payload: CreateResourceInput = {
            ...data,
            attributes: {},
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                <CardContent className="p-6 space-y-6">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="p-1.5 bg-blue-50 rounded-md">
                                <Info className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">Basic Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-600 font-medium">Resource Name</Label>
                                <Input 
                                    id="name"
                                    {...register('name')} 
                                    placeholder="e.g., Mountain View Deluxe Suite" 
                                    className={cn(
                                        "h-11 transition-all focus:ring-primary/20 focus:border-primary",
                                        errors.name && "border-destructive focus:ring-destructive/20"
                                    )}
                                />
                                {errors.name ? (
                                    <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
                                ) : (
                                    <p className="text-xs text-slate-400">Use a descriptive name that travelers will recognize.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-slate-600 font-medium">Category Type</Label>
                                <Select
                                    id="type"
                                    {...register('type')}
                                    className="h-11 transition-all focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="ROOM">🏨 Accommodation / Room</option>
                                    <option value="TOUR">🗺️ Guided Tour</option>
                                    <option value="TREK">🏔️ Mountain Trek</option>
                                    <option value="ACTIVITY">🎯 Outdoor Activity</option>
                                    <option value="VEHICLE">🚗 Transport Vehicle</option>
                                    <option value="EQUIPMENT">🛡️ Rental Equipment</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Capacity Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="p-1.5 bg-emerald-50 rounded-md">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">Pricing & Capacity</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="basePrice" className="text-slate-600 font-medium">Base Price (per unit)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                    <Input
                                        id="basePrice"
                                        type="number"
                                        {...register('basePrice')}
                                        placeholder="0.00"
                                        className="h-11 pl-7 transition-all focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                                {errors.basePrice && (
                                    <p className="text-xs font-medium text-destructive">{errors.basePrice.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capacity" className="text-slate-600 font-medium">Guest Capacity</Label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="capacity"
                                        type="number"
                                        {...register('capacity')}
                                        placeholder="1"
                                        className="h-11 pl-10 transition-all focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                {errors.capacity && (
                                    <p className="text-xs font-medium text-destructive">{errors.capacity.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="p-1.5 bg-amber-50 rounded-md">
                                <AlignLeft className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">Detailed Description</h3>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-slate-600 font-medium">Public Description</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                className="min-h-[80px] transition-all focus:ring-primary/20 focus:border-primary resize-none p-3"
                                placeholder="Describe the amenities, location, and what makes this resource unique..."
                            />
                            <p className="text-xs text-slate-400">Make it compelling for your customers. You can use markdown for formatting.</p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="bg-slate-50/50 px-6 py-4 flex justify-between gap-4 border-t border-slate-100">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={onCancel}
                        className="text-slate-500 hover:text-slate-800 hover:bg-white transition-all font-medium"
                    >
                        Discard Changes
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="min-w-[160px] bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all active:scale-[0.98] font-semibold"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Save Resource
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
