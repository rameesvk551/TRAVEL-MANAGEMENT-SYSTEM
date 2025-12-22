import React, { useState } from 'react';
import {
  X,
  Receipt,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { cn } from '../../../utils';
import {
  useExpense,
  useApproveExpenseClaim,
  useRejectExpenseClaim,
  useMarkExpensePaid,
} from '../../../hooks/hrms/useExpenses';
import type { ExpenseStatus, ExpenseItem } from '../../../api/hrms/expenseApi';

interface ExpenseClaimDetailsProps {
  claimId: string;
  canApprove?: boolean;
  canMarkPaid?: boolean;
  onClose: () => void;
}

const statusConfig: Record<ExpenseStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Send },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  PAID: { label: 'Paid', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: DollarSign },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: XCircle },
};

export const ExpenseClaimDetails: React.FC<ExpenseClaimDetailsProps> = ({
  claimId,
  canApprove = false,
  canMarkPaid = false,
  onClose,
}) => {
  const { data: claim, isLoading, error } = useExpense(claimId);
  const approveMutation = useApproveExpenseClaim();
  const rejectMutation = useRejectExpenseClaim();
  const markPaidMutation = useMarkExpensePaid();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = async () => {
    if (!claim) return;
    
    if (confirm(`Approve this expense claim for ${formatCurrency(claim.totalAmount, claim.currency)}?`)) {
      await approveMutation.mutateAsync({
        id: claimId,
        comments: 'Approved',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    await rejectMutation.mutateAsync({
      id: claimId,
      reason: rejectReason,
    });
    setShowRejectModal(false);
  };

  const handleMarkPaid = async () => {
    if (!paymentReference.trim()) {
      alert('Please provide a payment reference');
      return;
    }
    await markPaidMutation.mutateAsync({
      id: claimId,
      paymentReference,
    });
    setShowPaymentModal(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading expense claim...</p>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 text-center">Failed to load expense claim details.</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[claim.status];
  const StatusIcon = status.icon;
  const canTakeAction = canApprove && (claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW');
  const canPay = canMarkPaid && claim.status === 'APPROVED';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-gray-900">{claim.title}</h2>
                <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', status.bgColor, status.color)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </span>
              </div>
              {claim.claimNumber && (
                <p className="text-sm text-gray-500">Claim #{claim.claimNumber}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Amount</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(claim.totalAmount, claim.currency)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Created</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(claim.createdAt)}
                </p>
              </div>
            </div>

            {/* Trip Link */}
            {claim.tripName && (
              <div className="bg-indigo-50 rounded-lg p-3">
                <span className="text-sm text-indigo-600">
                  Linked Trip: <strong>{claim.tripName}</strong>
                </span>
              </div>
            )}

            {/* Description */}
            {claim.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Description
                </h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{claim.description}</p>
              </div>
            )}

            {/* Expense Items */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Receipt className="w-4 h-4 mr-2" />
                Expense Items ({claim.items?.length || 0})
              </h3>
              
              {claim.items && claim.items.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {claim.items.map((item: ExpenseItem, index: number) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {item.description}
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.amount, item.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-700 text-right">
                          Total
                        </td>
                        <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(claim.totalAmount, claim.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                  No expense items found
                </p>
              )}
            </div>

            {/* Timeline / History */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                History
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Created on {formatDateTime(claim.createdAt)}
                </div>
                {claim.submittedAt && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Submitted on {formatDateTime(claim.submittedAt)}
                  </div>
                )}
                {claim.reviewedAt && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    Reviewed on {formatDateTime(claim.reviewedAt)}
                    {claim.reviewerComments && (
                      <span className="text-gray-500">- {claim.reviewerComments}</span>
                    )}
                  </div>
                )}
                {claim.approvedAt && (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    Approved on {formatDateTime(claim.approvedAt)}
                    {claim.approvalComments && (
                      <span className="text-gray-500">- {claim.approvalComments}</span>
                    )}
                  </div>
                )}
                {claim.rejectedAt && (
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    Rejected on {formatDateTime(claim.rejectedAt)}
                    {claim.rejectionReason && (
                      <span className="text-gray-500">- {claim.rejectionReason}</span>
                    )}
                  </div>
                )}
                {claim.paidAt && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Paid on {formatDateTime(claim.paidAt)}
                    {claim.paymentReference && (
                      <span className="text-gray-500">- Ref: {claim.paymentReference}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>

            {canTakeAction && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejectMutation.isPending}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </button>
              </>
            )}

            {canPay && (
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={markPaidMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Expense Claim</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Please provide a reason for rejecting this expense claim..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark as Paid</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., TXN-12345 or Check #1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={markPaidMutation.isPending || !paymentReference.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {markPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseClaimDetails;
