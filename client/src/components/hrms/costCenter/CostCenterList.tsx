// components/hrms/costCenter/CostCenterList.tsx
// List of cost centers with budget overview

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Plus,
  ChevronRight,
  DollarSign,
  Users,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useCostCenters } from '../../../hooks/hrms/useCostCenter';

export function CostCenterList() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const { data: costCenters, isLoading } = useCostCenters({
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  // Calculate summary from cost centers
  const totalCostCenters = costCenters?.length || 0;
  const activeCostCenters = costCenters?.filter(cc => cc.isActive).length || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cost Centers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage cost centers and track labor costs
          </p>
        </div>
        <Link
          to="/hrms/cost-centers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Cost Center
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost Centers</p>
              <p className="text-xl font-bold text-gray-900">{totalCostCenters}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Centers</p>
              <p className="text-xl font-bold text-gray-900">{activeCostCenters}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">With Children</p>
              <p className="text-xl font-bold text-gray-900">
                {costCenters?.filter(cc => cc.parentId).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hierarchy Levels</p>
              <p className="text-xl font-bold text-gray-900">
                {costCenters?.some(cc => cc.parentId) ? 'Multi-level' : 'Flat'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Status:</span>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-lg capitalize ${
                  statusFilter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Centers List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : costCenters?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Building className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cost centers found</h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first cost center
          </p>
          <Link
            to="/hrms/cost-centers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Cost Center
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {costCenters?.map((costCenter) => (
            <Link
              key={costCenter.id}
              to={`/hrms/cost-centers/${costCenter.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  costCenter.isActive ? 'bg-blue-50' : 'bg-gray-100'
                }`}>
                  <Building className={`w-5 h-5 ${
                    costCenter.isActive ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{costCenter.name}</p>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {costCenter.code}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {costCenter.description || 'No description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    costCenter.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {costCenter.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
