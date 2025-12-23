// components/hrms/approval/ApprovalChainList.tsx
// List of approval chains with management actions

import { Link } from 'react-router-dom';
import {
  Plus,
  ChevronRight,
  GitBranch,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useApprovalChains, useDeleteApprovalChain } from '../../../hooks/hrms/useApproval';

export function ApprovalChainList() {
  const { data: chains, isLoading } = useApprovalChains();
  const deleteMutation = useDeleteApprovalChain();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this approval chain?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Approval Chains</h1>
          <p className="text-sm text-gray-500 mt-1">Manage approval workflows for different request types</p>
        </div>
        <Link
          to="/hrms/approvals/chains/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Chain
        </Link>
      </div>

      {/* Chains List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : chains?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <GitBranch className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No approval chains</h3>
          <p className="text-gray-500 mb-4">Create your first approval workflow to get started</p>
          <Link
            to="/hrms/approvals/chains/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Chain
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {chains?.map((chain) => (
            <Link
              key={chain.id}
              to={`/hrms/approvals/chains/${chain.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  chain.isActive ? 'bg-blue-50' : 'bg-gray-100'
                }`}>
                  <GitBranch className={`w-5 h-5 ${chain.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{chain.name}</p>
                    {chain.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">{chain.entityType}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{chain.steps?.length || 0} steps</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  chain.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {chain.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {chain.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={(e) => handleDelete(chain.id, e)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
