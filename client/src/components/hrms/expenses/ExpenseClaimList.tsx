import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../utils';
import {
  useExpenseClaims,
  useDeleteExpenseClaim,
  useSubmitExpenseClaim,
} from '../../../hooks/hrms/useExpenses';
import type { ExpenseClaim, ExpenseStatus } from '../../../api/hrms/expenseApi';

interface ExpenseClaimListProps {
  onCreateNew: () => void;
  onView: (claim: ExpenseClaim) => void;
  onEdit: (claim: ExpenseClaim) => void;
}

const statusConfig: Record<ExpenseStatus, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Send },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  PAID: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: DollarSign },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

export const ExpenseClaimList: React.FC<ExpenseClaimListProps> = ({
  onCreateNew,
  onView,
  onEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: claims = [], isLoading } = useExpenseClaims({
    status: statusFilter || undefined,
  });

  const deleteMutation = useDeleteExpenseClaim();
  const submitMutation = useSubmitExpenseClaim();

  const totalCount = claims.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredClaims = claims.filter((claim: ExpenseClaim) =>
    claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (claim: ExpenseClaim) => {
    if (confirm(`Are you sure you want to delete expense claim "${claim.title}"?`)) {
      await deleteMutation.mutateAsync(claim.id);
    }
  };

  const handleSubmit = async (claim: ExpenseClaim) => {
    if (confirm(`Submit expense claim "${claim.title}" for approval?`)) {
      await submitMutation.mutateAsync(claim.id);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Expense Claims</h2>
          <p className="text-sm text-gray-500">
            {totalCount} total claim{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Expense Claim
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or claim number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ExpenseStatus | '');
              setCurrentPage(1);
            }}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusConfig).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No expense claims found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filters'
              : 'Create your first expense claim to get started'}
          </p>
          {!searchTerm && !statusFilter && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Expense Claim
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClaims.map((claim: ExpenseClaim) => {
                  const status = statusConfig[claim.status];
                  const StatusIcon = status.icon;
                  const canEdit = claim.status === 'DRAFT';
                  const canSubmit = claim.status === 'DRAFT';
                  const canDelete = claim.status === 'DRAFT';

                  return (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{claim.title}</div>
                          {claim.claimNumber && (
                            <div className="text-sm text-gray-500">{claim.claimNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(claim.totalAmount, claim.currency)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            status.color
                          )}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onView(claim)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => onEdit(claim)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canSubmit && (
                            <button
                              onClick={() => handleSubmit(claim)}
                              disabled={submitMutation.isPending}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Submit for approval"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(claim)}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} claims
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseClaimList;
