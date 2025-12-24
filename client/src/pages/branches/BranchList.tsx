import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBranchesWithStats, useBranchMutations } from '../../hooks/useBranches';
import { getBranchTypeLabel } from '../../types/branch.types';
import type { BranchWithStats } from '../../types/branch.types';

export function BranchList() {
    const { branches, isLoading, error, refetch } = useBranchesWithStats();
    const { deleteBranch, isLoading: isDeleting } = useBranchMutations();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        const success = await deleteBranch(id);
        if (success) {
            refetch();
            setDeleteConfirmId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Error loading branches</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
                    <p className="text-gray-600">Manage your company's locations and offices</p>
                </div>
                <Link
                    to="/branches/new"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Branch
                </Link>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Branches"
                    value={branches.length}
                    icon="🏢"
                />
                <StatCard
                    title="Total Employees"
                    value={branches.reduce((sum, b) => sum + (b.employeeCount || 0), 0)}
                    icon="👥"
                />
                <StatCard
                    title="Active Bookings"
                    value={branches.reduce((sum, b) => sum + (b.activeBookingsCount || 0), 0)}
                    icon="📅"
                />
                <StatCard
                    title="Total Resources"
                    value={branches.reduce((sum, b) => sum + (b.resourceCount || 0), 0)}
                    icon="🎒"
                />
            </div>

            {/* Branch Grid */}
            {branches.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-4">🏢</div>
                    <h3 className="text-lg font-medium text-gray-900">No branches yet</h3>
                    <p className="text-gray-600 mt-1">Create your first branch to get started</p>
                    <Link
                        to="/branches/new"
                        className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Add Branch
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch) => (
                        <BranchCard
                            key={branch.id}
                            branch={branch}
                            onDelete={() => setDeleteConfirmId(branch.id)}
                            isDeleting={isDeleting && deleteConfirmId === branch.id}
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <DeleteConfirmModal
                    branchName={branches.find(b => b.id === deleteConfirmId)?.name || ''}
                    onConfirm={() => handleDelete(deleteConfirmId)}
                    onCancel={() => setDeleteConfirmId(null)}
                    isLoading={isDeleting}
                />
            )}
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
                <span className="text-2xl mr-3">{icon}</span>
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function BranchCard({
    branch,
    onDelete,
    isDeleting,
}: {
    branch: BranchWithStats;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    const typeColors: Record<string, string> = {
        HEAD_OFFICE: 'bg-purple-100 text-purple-800',
        REGIONAL_OFFICE: 'bg-blue-100 text-blue-800',
        OFFICE: 'bg-gray-100 text-gray-800',
        WAREHOUSE: 'bg-yellow-100 text-yellow-800',
        OPERATIONAL_BASE: 'bg-green-100 text-green-800',
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                        <p className="text-sm text-gray-500">{branch.code}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[branch.type] || typeColors.OFFICE}`}>
                        {getBranchTypeLabel(branch.type)}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Employees</p>
                    <p className="font-semibold">{branch.employeeCount || 0}</p>
                </div>
                <div>
                    <p className="text-gray-500">Resources</p>
                    <p className="font-semibold">{branch.resourceCount || 0}</p>
                </div>
                <div>
                    <p className="text-gray-500">Active Bookings</p>
                    <p className="font-semibold">{branch.activeBookingsCount || 0}</p>
                </div>
                <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-semibold truncate">{branch.address?.city || 'N/A'}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <Link
                    to={`/branches/${branch.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                    View Details
                </Link>
                <div className="flex items-center space-x-2">
                    <Link
                        to={`/branches/${branch.id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Edit"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </Link>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirmModal({
    branchName,
    onConfirm,
    onCancel,
    isLoading,
}: {
    branchName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Branch</h3>
                    <p className="text-gray-500">
                        Are you sure you want to delete <strong>{branchName}</strong>? This action cannot be undone.
                    </p>
                </div>
                <div className="mt-6 flex space-x-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BranchList;
