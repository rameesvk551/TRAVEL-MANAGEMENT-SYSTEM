/**
 * Leave Request Form Component
 * Apply for leave with balance display
 */
import { useForm } from 'react-hook-form';
import { useLeaveBalance, useApplyLeave } from '@/hooks/hrms';
import { Button, Input, Card, CardHeader, CardContent } from '@/components/ui';
import type { CreateLeaveDTO, LeaveType } from '@/types/hrms.types';

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
    { value: 'casual', label: 'Casual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'earned', label: 'Earned Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
];

interface LeaveRequestFormProps {
    onSuccess?: () => void;
}

export function LeaveRequestForm({ onSuccess }: LeaveRequestFormProps) {
    const { data: balanceData, isLoading: loadingBalance } = useLeaveBalance();
    const applyMutation = useApplyLeave();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<CreateLeaveDTO>();

    const selectedType = watch('leaveType');
    const startDate = watch('startDate');
    const endDate = watch('endDate');

    const selectedBalance = balanceData?.data?.find(
        (b) => b.leaveType === selectedType
    );

    const calculateDays = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff + 1; // inclusive
    };

    const onSubmit = async (data: CreateLeaveDTO) => {
        try {
            await applyMutation.mutateAsync(data);
            reset();
            onSuccess?.();
        } catch (error) {
            console.error('Failed to apply leave:', error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold">Apply for Leave</h2>
            </CardHeader>
            <CardContent>
                {/* Leave Balances */}
                {!loadingBalance && balanceData?.data && (
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {balanceData.data.slice(0, 3).map((balance) => (
                            <div
                                key={balance.leaveType}
                                className="p-3 bg-gray-50 rounded text-center"
                            >
                                <div className="text-2xl font-bold text-blue-600">
                                    {balance.remaining}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                    {balance.leaveType}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Leave Type *
                        </label>
                        <select
                            {...register('leaveType', { required: 'Required' })}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">Select type...</option>
                            {LEAVE_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        {selectedBalance && (
                            <span className="text-xs text-gray-500">
                                Available: {selectedBalance.remaining} days
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Start Date *
                            </label>
                            <Input
                                type="date"
                                {...register('startDate', { required: 'Required' })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                End Date *
                            </label>
                            <Input
                                type="date"
                                {...register('endDate', { required: 'Required' })}
                            />
                        </div>
                    </div>

                    {startDate && endDate && (
                        <div className="p-2 bg-blue-50 rounded text-sm text-center">
                            Total: <strong>{calculateDays()}</strong> day(s)
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Reason *
                        </label>
                        <textarea
                            {...register('reason', {
                                required: 'Please provide a reason',
                                minLength: { value: 10, message: 'Min 10 characters' },
                            })}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                            placeholder="Reason for leave..."
                        />
                        {errors.reason && (
                            <span className="text-red-500 text-xs">
                                {errors.reason.message}
                            </span>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || applyMutation.isPending}
                        className="w-full"
                    >
                        {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
