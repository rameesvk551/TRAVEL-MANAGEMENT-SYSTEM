// components/hrms/approval/ApprovalRequestList.tsx
// List of approval requests with filtering and actions

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Search,
  FileText,
} from 'lucide-react';
import {
  useApprovalRequests,
  usePendingApprovals,
} from '../../../hooks/hrms/useApproval';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ESCALATED';
type ApprovalEntityType = 'LEAVE' | 'EXPENSE' | 'OVERTIME' | 'TRAVEL' | 'DOCUMENT' | 'SALARY_CHANGE' | 'PROMOTION' | 'TERMINATION';

const statusConfig: Record<ApprovalStatus, { icon: React.ReactNode; color: string; label: string }> = {
  PENDING: { icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  APPROVED: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-100 text-green-700', label: 'Approved' },
  REJECTED: { icon: <XCircle className="w-4 h-4" />, color: 'bg-red-100 text-red-700', label: 'Rejected' },
  CANCELLED: { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-gray-100 text-gray-700', label: 'Cancelled' },
  ESCALATED: { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700', label: 'Escalated' },
};

const entityTypeLabels: Record<ApprovalEntityType, string> = {
  LEAVE: 'Leave Request',
  EXPENSE: 'Expense Claim',
  OVERTIME: 'Overtime',
  TRAVEL: 'Travel Request',
  DOCUMENT: 'Document',
  SALARY_CHANGE: 'Salary Change',
  PROMOTION: 'Promotion',
  TERMINATION: 'Termination',
};

interface ApprovalRequestListProps {
  mode?: 'all' | 'pending-approvals' | 'my-requests';
  employeeId?: string;
}

export function ApprovalRequestList({ mode = 'all' }: ApprovalRequestListProps) {
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'ALL'>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<ApprovalEntityType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Use appropriate hook based on mode
  const { data: allRequests, isLoading: isLoadingAll } = useApprovalRequests(
    mode === 'all' ? {
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      entityType: entityTypeFilter !== 'ALL' ? entityTypeFilter : undefined,
    } : undefined
  );

  const { data: pendingApprovals, isLoading: isLoadingPending } = usePendingApprovals();

  const isLoading = mode === 'pending-approvals' ? isLoadingPending : isLoadingAll;
  
  // Get the correct data based on mode
  const rawRequests = mode === 'pending-approvals' 
    ? pendingApprovals?.map(p => ({
        id: p.request.id,
        entityType: p.request.entityType,
        entityId: p.request.entityId,
        status: 'PENDING' as ApprovalStatus,
        currentStep: p.request.currentStep,
        createdAt: p.request.createdAt,
        updatedAt: p.request.updatedAt,
      }))
    : allRequests;

  // Apply search filter
  const filteredRequests = rawRequests?.filter((request) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const entityLabel = entityTypeLabels[request.entityType as ApprovalEntityType];
    return (
      request.entityId?.toLowerCase().includes(searchLower) ||
      entityLabel?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === 'pending-approvals' ? 'Pending Approvals' : 'Approval Requests'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'pending-approvals'
              ? 'Requests waiting for your approval'
              : 'View and track all approval requests'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          {mode !== 'pending-approvals' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'ALL')}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          )}

          {/* Entity Type Filter */}
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value as ApprovalEntityType | 'ALL')}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            {Object.entries(entityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredRequests?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-500">
            {mode === 'pending-approvals'
              ? 'You have no pending approvals'
              : 'No approval requests match your filters'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {filteredRequests?.map((request) => {
            const status = statusConfig[request.status as ApprovalStatus] || statusConfig.PENDING;
            const entityLabel = entityTypeLabels[request.entityType as ApprovalEntityType] || request.entityType;
            
            return (
              <Link
                key={request.id}
                to={`/hrms/approvals/requests/${request.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color}`}>
                    {status.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{entityLabel}</p>
                    <p className="text-sm text-gray-500">
                      #{request.id?.slice(0, 8)} • Step {request.currentStep || 1}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${status.color.replace('bg-', 'text-').replace('-100', '-700')}`}>
                      {status.label}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
