/**
 * Expense Claims Page
 * Submit, view, and manage expense claims
 */
import { useState } from 'react';
import { 
  ExpenseClaimList, 
  ExpenseClaimForm, 
  ExpenseClaimDetails,
  ExpenseApprovalPanel 
} from '@/components/hrms';
import type { ExpenseClaim } from '@/api/hrms/expenseApi';

type TabType = 'my-expenses' | 'approvals';
type ViewMode = 'list' | 'form' | 'details' | 'approve';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('my-expenses');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'my-expenses', label: 'My Expenses' },
    { id: 'approvals', label: 'Pending Approvals' },
  ];

  const handleCreateNew = () => {
    setSelectedClaim(null);
    setViewMode('form');
  };

  const handleView = (claim: ExpenseClaim) => {
    setSelectedClaim(claim);
    setViewMode('details');
  };

  const handleEdit = (claim: ExpenseClaim) => {
    setSelectedClaim(claim);
    setViewMode('form');
  };

  const handleClose = () => {
    setViewMode('list');
    setSelectedClaim(null);
  };

  const handleSuccess = () => {
    setViewMode('list');
    setSelectedClaim(null);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Expense Claims</h1>
          <p className="text-gray-500 mt-1">
            Submit and track your expense reimbursements
          </p>
        </div>

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

        {/* Content */}
        {viewMode === 'list' && (
          <ExpenseClaimList
            onCreateNew={handleCreateNew}
            onView={handleView}
            onEdit={handleEdit}
          />
        )}

        {/* Form Modal */}
        {viewMode === 'form' && (
          <ExpenseClaimForm
            claim={selectedClaim || undefined}
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        )}

        {/* Details Modal */}
        {viewMode === 'details' && selectedClaim && (
          <ExpenseClaimDetails
            claimId={selectedClaim.id}
            canApprove={activeTab === 'approvals'}
            canMarkPaid={activeTab === 'approvals'}
            onClose={handleClose}
          />
        )}

        {/* Approval Panel */}
        {viewMode === 'approve' && selectedClaim && (
          <ExpenseApprovalPanel
            claim={selectedClaim}
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
