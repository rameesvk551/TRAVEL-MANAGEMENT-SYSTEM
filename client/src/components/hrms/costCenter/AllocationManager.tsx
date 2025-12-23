// components/hrms/costCenter/AllocationManager.tsx
// Employee cost allocation management

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  User,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  X,
  Percent,
} from 'lucide-react';
import {
  useEmployeeAllocations,
  useCostAllocations,
  useCreateAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
} from '../../../hooks/hrms/useCostCenter';

interface AllocationManagerProps {
  costCenterId?: string;
  employeeId?: string;
  mode: 'cost-center' | 'employee';
}

export function AllocationManager({ costCenterId, employeeId, mode }: AllocationManagerProps) {
  const params = useParams();
  const resolvedCostCenterId = costCenterId || params.costCenterId;
  const resolvedEmployeeId = employeeId || params.employeeId;

  // Use the correct hook based on mode - use filters for cost-center mode
  const { data: employeeAllocs, isLoading: isLoadingEmployee } = useEmployeeAllocations(
    mode === 'employee' ? (resolvedEmployeeId || '') : ''
  );
  
  const { data: costCenterAllocs, isLoading: isLoadingCostCenter } = useCostAllocations(
    mode === 'cost-center' ? { costCenterId: resolvedCostCenterId } : undefined
  );

  const allocations = mode === 'employee' ? employeeAllocs : costCenterAllocs;
  const isLoading = mode === 'employee' ? isLoadingEmployee : isLoadingCostCenter;

  const createMutation = useCreateAllocation();
  const updateMutation = useUpdateAllocation();
  const deleteMutation = useDeleteAllocation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    employeeId: '',
    costCenterId: '',
    allocationPercentage: 100,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
  });

  // Calculate total allocation percentage
  const totalAllocation = allocations?.reduce(
    (sum, a) => sum + a.allocationPercentage,
    0
  ) || 0;

  const handleSaveEdit = async (allocationId: string) => {
    try {
      await updateMutation.mutateAsync({
        id: allocationId,
        data: { allocationPercentage: editValue },
      });
      setEditingId(null);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (allocationId: string) => {
    if (!window.confirm('Are you sure you want to remove this allocation?')) return;
    try {
      await deleteMutation.mutateAsync(allocationId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleCreateNew = async () => {
    try {
      await createMutation.mutateAsync({
        employeeId: mode === 'cost-center' ? newAllocation.employeeId : resolvedEmployeeId!,
        costCenterId: mode === 'employee' ? newAllocation.costCenterId : resolvedCostCenterId!,
        allocationPercentage: newAllocation.allocationPercentage,
        effectiveFrom: newAllocation.effectiveFrom,
        effectiveTo: newAllocation.effectiveTo || undefined,
      });
      setShowNewForm(false);
      setNewAllocation({
        employeeId: '',
        costCenterId: '',
        allocationPercentage: 100,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: '',
      });
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cost Allocations</h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'cost-center'
              ? 'Employees allocated to this cost center'
              : 'Cost centers this employee is allocated to'}
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Allocation
        </button>
      </div>

      {/* Total Allocation Warning */}
      {totalAllocation !== 100 && allocations && allocations.length > 0 && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          totalAllocation > 100 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">
              {totalAllocation > 100
                ? 'Over-allocated'
                : 'Under-allocated'}
            </p>
            <p className="text-sm">
              Total allocation is {totalAllocation}% (should be 100%)
            </p>
          </div>
        </div>
      )}

      {/* New Allocation Form */}
      {showNewForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-4">New Allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {mode === 'cost-center' ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={newAllocation.employeeId}
                  onChange={(e) => setNewAllocation({ ...newAllocation, employeeId: e.target.value })}
                  placeholder="Enter employee ID"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Center ID
                </label>
                <input
                  type="text"
                  value={newAllocation.costCenterId}
                  onChange={(e) => setNewAllocation({ ...newAllocation, costCenterId: e.target.value })}
                  placeholder="Enter cost center ID"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allocation %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={newAllocation.allocationPercentage}
                onChange={(e) => setNewAllocation({ ...newAllocation, allocationPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective From
              </label>
              <input
                type="date"
                value={newAllocation.effectiveFrom}
                onChange={(e) => setNewAllocation({ ...newAllocation, effectiveFrom: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNew}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Allocations List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : allocations?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Percent className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No allocations</h3>
          <p className="text-gray-500">
            {mode === 'cost-center'
              ? 'No employees are allocated to this cost center yet'
              : 'This employee is not allocated to any cost centers'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {allocations?.map((allocation) => (
            <div
              key={allocation.id}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {mode === 'cost-center'
                      ? `Employee: ${allocation.employeeId}`
                      : `Cost Center: ${allocation.costCenterId}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Effective: {new Date(allocation.effectiveFrom).toLocaleDateString()}
                    {allocation.effectiveTo && ` - ${new Date(allocation.effectiveTo).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {editingId === allocation.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editValue}
                      onChange={(e) => setEditValue(Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-center"
                    />
                    <span className="text-gray-500">%</span>
                    <button
                      onClick={() => handleSaveEdit(allocation.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-right">
                      <p className="text-lg font-medium text-gray-900">
                        {allocation.allocationPercentage}%
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(allocation.id);
                        setEditValue(allocation.allocationPercentage);
                      }}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(allocation.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Bar */}
      {allocations && allocations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Allocation</span>
            <span className={`text-lg font-bold ${
              totalAllocation === 100 ? 'text-green-600' :
              totalAllocation > 100 ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {totalAllocation}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                totalAllocation === 100 ? 'bg-green-500' :
                totalAllocation > 100 ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(totalAllocation, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
