/**
 * Leave Management Page
 * Apply, view, and manage leaves
 */
import { useState } from 'react';
import { LeaveRequestForm, LeaveApprovals } from '@/components/hrms';
import { useMyLeaves, useLeaveBalance } from '@/hooks/hrms';
import { Badge, Card, CardHeader, CardContent } from '@/components/ui';
import type { LeaveStatus } from '@/types/hrms.types';

const STATUS_COLORS: Record<LeaveStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
};

type TabType = 'apply' | 'my-leaves' | 'approvals';

export default function LeavesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('apply');
    const { data: leavesData, isLoading } = useMyLeaves();
    const { data: balanceData } = useLeaveBalance();

    const tabs: { id: TabType; label: string }[] = [
        { id: 'apply', label: 'Apply Leave' },
        { id: 'my-leaves', label: 'My Leaves' },
        { id: 'approvals', label: 'Approvals' },
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 border-b">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent hover:border-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Leave Balances */}
            {balanceData?.data && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                    {balanceData.data.map((balance) => (
                        <div
                            key={balance.leaveType}
                            className="p-2 bg-gray-50 rounded text-center"
                        >
                            <div className="text-lg font-bold text-blue-600">
                                {balance.remaining}/{balance.total}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                                {balance.leaveType}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'apply' && (
                <LeaveRequestForm onSuccess={() => setActiveTab('my-leaves')} />
            )}

            {activeTab === 'my-leaves' && (
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">My Leave Requests</h2>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div>Loading...</div>
                        ) : leavesData?.data?.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No leave requests found
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leavesData?.data?.map((leave) => (
                                    <div
                                        key={leave.id}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-medium capitalize">
                                                    {leave.leaveType} Leave
                                                </span>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(leave.startDate).toLocaleDateString()} -{' '}
                                                    {new Date(leave.endDate).toLocaleDateString()}
                                                    <span className="ml-2">
                                                        ({leave.totalDays} days)
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge className={STATUS_COLORS[leave.status]}>
                                                {leave.status}
                                            </Badge>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            {leave.reason}
                                        </div>
                                        {leave.approverRemarks && (
                                            <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                                                <strong>Remarks:</strong> {leave.approverRemarks}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'approvals' && <LeaveApprovals />}
        </div>
    );
}
