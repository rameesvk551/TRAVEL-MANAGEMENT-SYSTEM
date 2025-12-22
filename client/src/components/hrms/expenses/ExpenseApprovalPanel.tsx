import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Clock, 
  User, 
  FileText,
  MessageSquare,
  Receipt,
  Calendar,
} from 'lucide-react';
import { cn } from '../../../utils';
import { useApproveExpenseClaim, useRejectExpenseClaim, useMarkExpensePaid } from '../../../hooks/hrms/useExpenses';
import type { ExpenseClaim, ExpenseStatus, ExpenseItem } from '../../../api/hrms/expenseApi';

interface ExpenseApprovalPanelProps {
  claim: ExpenseClaim;
  onClose: () => void;
  onSuccess?: () => void;
}

const statusConfig: Record<ExpenseStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  SUBMITTED: { label: 'Pending Approval', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  APPROVED: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  PAID: { label: 'Paid', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

const categoryLabels: Record<string, string> = {
  TRANSPORT: 'Transportation',
  ACCOMMODATION: 'Accommodation',
  MEALS: 'Meals & Food',
  COMMUNICATION: 'Communication',
  EQUIPMENT: 'Equipment',
  FUEL: 'Fuel',
  TOLLS: 'Tolls',
  PARKING: 'Parking',
  ENTERTAINMENT: 'Entertainment',
  SUPPLIES: 'Supplies',
  OTHER: 'Other',
};

export const ExpenseApprovalPanel: React.FC<ExpenseApprovalPanelProps> = ({
  claim,
  onClose,
  onSuccess,
}) => {
  const [comments, setComments] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const approveMutation = useApproveExpenseClaim();
  const rejectMutation = useRejectExpenseClaim();
  const markPaidMutation = useMarkExpensePaid();

  const canApprove = claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW';
  const canMarkPaid = claim.status === 'APPROVED';

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        id: claim.id,
        comments: comments || 'Approved',
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to approve claim:', error);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        id: claim.id,
        reason: comments,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to reject claim:', error);
    }
  };

  const handleMarkPaid = async () => {
    if (!paymentReference.trim()) {
      alert('Please provide a payment reference');
      return;
    }
    try {
      await markPaidMutation.mutateAsync({
        id: claim.id,
        paymentReference,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
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

  const status = statusConfig[claim.status];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">{claim.title}</h2>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', status.bgColor, status.color)}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {claim.claimNumber}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(claim.createdAt)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(claim.totalAmount, claim.currency)}
              </div>
            </div>
            {claim.tripName && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-indigo-600 mb-1">Linked Trip</div>
                <div className="text-lg font-semibold text-indigo-700">
                  {claim.tripName}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {claim.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{claim.description}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Expense Items</h3>
            <div className="space-y-2">
              {claim.items?.map((item: ExpenseItem, index: number) => (
                <div
                  key={item.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Receipt className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {categoryLabels[item.category] || item.category}
                      </div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatCurrency(item.amount, item.currency)}</div>
                    <div className="text-xs text-gray-500">{formatDate(item.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Actions */}
          {canApprove && !showRejectForm && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Approval Actions</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={2}
                    placeholder="Add any comments..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {canApprove && showRejectForm && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-red-700 mb-3">Rejection Reason</h3>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="Please provide a reason for rejection (required)..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          )}

          {/* Payment Form */}
          {canMarkPaid && showPaymentForm && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-emerald-700 mb-3">Payment Details</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Payment Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., TXN-12345 or Check #1234"
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Reviewer Info */}
          {claim.reviewedBy && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <User className="h-4 w-4" />
                Reviewed by: {claim.reviewedBy}
              </div>
              {claim.reviewedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  On: {formatDate(claim.reviewedAt)}
                </div>
              )}
              {claim.reviewerComments && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <MessageSquare className="h-4 w-4" />
                    Comments:
                  </div>
                  <p className="text-gray-700">{claim.reviewerComments}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>

          {canApprove && !showRejectForm && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
            </div>
          )}

          {canApprove && showRejectForm && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !comments.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Confirm Rejection
              </button>
            </div>
          )}

          {canMarkPaid && !showPaymentForm && (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Mark as Paid
            </button>
          )}

          {canMarkPaid && showPaymentForm && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={markPaidMutation.isPending || !paymentReference.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <DollarSign className="h-4 w-4" />
                Confirm Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseApprovalPanel;
