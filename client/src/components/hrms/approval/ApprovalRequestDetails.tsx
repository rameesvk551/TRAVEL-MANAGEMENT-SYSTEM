// components/hrms/approval/ApprovalRequestDetails.tsx
// Detailed view of a single approval request with action buttons

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import {
  useApprovalRequest,
  useProcessApproval,
  useCancelApprovalRequest,
} from '../../../hooks/hrms/useApproval';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ESCALATED';

const statusConfig: Record<ApprovalStatus, { icon: React.ReactNode; color: string; label: string }> = {
  PENDING: { icon: <Clock className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
  APPROVED: { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-100 text-green-700 border-green-200', label: 'Approved' },
  REJECTED: { icon: <XCircle className="w-5 h-5" />, color: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected' },
  CANCELLED: { icon: <AlertCircle className="w-5 h-5" />, color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Cancelled' },
  ESCALATED: { icon: <AlertCircle className="w-5 h-5" />, color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Escalated' },
};

export function ApprovalRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: request, isLoading } = useApprovalRequest(id || '');
  const processApproval = useProcessApproval();
  const cancelRequest = useCancelApprovalRequest();

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingAction, setPendingAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [expandedHistory, setExpandedHistory] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found</p>
      </div>
    );
  }

  const status = statusConfig[request.status as ApprovalStatus] || statusConfig.PENDING;
  const canTakeAction = request.status === 'PENDING';

  const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (!id) return;
    
    try {
      await processApproval.mutateAsync({
        requestId: id,
        data: {
          action,
          comments: comment || undefined,
        },
      });
      navigate('/hrms/approvals/requests');
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to cancel this request?')) {
      try {
        await cancelRequest.mutateAsync(id);
        navigate('/hrms/approvals/requests');
      } catch (error) {
        console.error('Cancel failed:', error);
      }
    }
  };

  const requestData = request.metadata as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Approval Request
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              #{request.id?.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${status.color}`}>
          {status.icon}
          <span className="font-medium">{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Request Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Request Type</label>
                <p className="font-medium text-gray-900">{request.entityType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Entity ID</label>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {request.entityId || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Submitted</label>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Current Step</label>
                <p className="font-medium text-gray-900">{request.currentStep || 1}</p>
              </div>
            </div>

            {/* Request Data */}
            {requestData && Object.keys(requestData).length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-3">Request Data</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(requestData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Approval History */}
          <div className="bg-white rounded-lg shadow-sm border">
            <button
              onClick={() => setExpandedHistory(!expandedHistory)}
              className="w-full flex items-center justify-between p-4 border-b"
            >
              <h2 className="text-lg font-medium text-gray-900">Approval History</h2>
              {expandedHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedHistory && (
              <div className="p-4">
                {request.actions && request.actions.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                    <div className="space-y-4">
                      {request.actions.map((action, index) => (
                        <div key={action.id || index} className="relative flex gap-4 pl-8">
                          <div className={`absolute left-2 w-4 h-4 rounded-full ${
                            action.action === 'APPROVED' ? 'bg-green-500' :
                            action.action === 'REJECTED' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{action.action}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(action.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {action.comments && (
                              <p className="mt-2 text-sm text-gray-600">{action.comments}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No actions taken yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Action Panel */}
          {canTakeAction && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium text-gray-900 mb-4">Take Action</h3>
              
              {!showCommentInput ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowCommentInput(true);
                      setPendingAction('APPROVED');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowCommentInput(true);
                      setPendingAction('REJECTED');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">
                      Comment {pendingAction === 'REJECTED' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={`Add a comment for your ${pendingAction?.toLowerCase()} decision...`}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowCommentInput(false);
                        setPendingAction(null);
                        setComment('');
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => pendingAction && handleAction(pendingAction)}
                      disabled={pendingAction === 'REJECTED' && !comment}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                        pendingAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancel Button - for requester */}
          {request.status === 'PENDING' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium text-gray-900 mb-4">Request Actions</h3>
              <button
                onClick={handleCancel}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel Request
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MessageSquare className="w-4 h-4" />
                <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
              {request.updatedAt && request.updatedAt !== request.createdAt && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Updated: {new Date(request.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
              {request.completedAt && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed: {new Date(request.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
