/**
 * Leave Approvals Component
 * Manager view for pending leave requests
 */
import { useState } from 'react';
import { usePendingApprovals, useApproveLeave, useRejectLeave } from '@/hooks/hrms';
import { Button, Badge, Card, CardHeader, CardContent, Input } from '@/components/ui';
import type { Leave } from '@/types/hrms.types';

const TYPE_COLORS: Record<string, string> = {
    casual: 'bg-blue-100 text-blue-800',
    sick: 'bg-red-100 text-red-800',
    earned: 'bg-green-100 text-green-800',
    unpaid: 'bg-gray-100 text-gray-800',
};

export function LeaveApprovals() {
    const { data, isLoading, refetch } = usePendingApprovals();
    const approveMutation = useApproveLeave();
    const rejectMutation = useRejectLeave();

    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [remarks, setRemarks] = useState('');
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);

    const handleAction = async () => {
        if (!selectedLeave || !action) return;

        try {
            if (action === 'approve') {
                await approveMutation.mutateAsync({ id: selectedLeave.id, remarks });
            } else {
                await rejectMutation.mutateAsync({ id: selectedLeave.id, remarks });
            }
            setSelectedLeave(null);
            setRemarks('');
            setAction(null);
            refetch();
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    if (isLoading) {
        return <div className="p-4">Loading pending approvals...</div>;
    }

    const pendingLeaves = data?.data || [];

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold">
                    Pending Leave Approvals ({pendingLeaves.length})
                </h2>
            </CardHeader>
            <CardContent>
                {pendingLeaves.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No pending leave requests
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingLeaves.map((leave) => (
                            <div
                                key={leave.id}
                                className="border rounded-lg p-4 hover:bg-gray-50"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium">
                                            Employee #{leave.employeeId.slice(0, 8)}
                                        </div>
                                        <Badge className={TYPE_COLORS[leave.leaveType] || ''}>
                                            {leave.leaveType}
                                        </Badge>
                                    </div>
                                    <div className="text-right text-sm">
                                        <div>
                                            {new Date(leave.startDate).toLocaleDateString()} -{' '}
                                            {new Date(leave.endDate).toLocaleDateString()}
                                        </div>
                                        <div className="text-gray-500">
                                            {leave.totalDays} day(s)
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 text-sm text-gray-600">
                                    <strong>Reason:</strong> {leave.reason}
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedLeave(leave);
                                            setAction('approve');
                                        }}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedLeave(leave);
                                            setAction('reject');
                                        }}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Modal */}
                {selectedLeave && action && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">
                                {action === 'approve' ? 'Approve' : 'Reject'} Leave Request
                            </h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">
                                    Remarks {action === 'reject' && '(required)'}
                                </label>
                                <Input
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add remarks..."
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedLeave(null);
                                        setAction(null);
                                        setRemarks('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAction}
                                    disabled={
                                        action === 'reject' && !remarks.trim()
                                    }
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
