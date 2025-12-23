// pages/hrms/CostCentersPage.tsx
// Cost Center & Labor Cost Management Page

import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  PieChart,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { CostCenterList, AllocationManager } from '../../components/hrms/costCenter';

type Tab = 'centers' | 'allocations' | 'budgets' | 'reports';

export function CostCentersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('centers');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'centers', label: 'Cost Centers', icon: <Building2 className="h-4 w-4" /> },
    { id: 'allocations', label: 'Allocations', icon: <Users className="h-4 w-4" /> },
    { id: 'budgets', label: 'Budgets', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'reports', label: 'Reports', icon: <PieChart className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Building2 className="h-7 w-7 text-blue-600" />
          Cost Centers & Labor Costs
        </h1>
        <p className="mt-1 text-gray-500">
          Manage cost centers, employee allocations, and labor cost tracking
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Cost Centers</p>
              <p className="text-2xl font-bold mt-1">12</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold mt-1">15.2B</p>
              <p className="text-xs text-gray-400">IDR</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Actual Spend (YTD)</p>
              <p className="text-2xl font-bold mt-1">12.8B</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> 16% under budget
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">At Risk</p>
              <p className="text-2xl font-bold mt-1">2</p>
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Over budget
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'centers' && (
        <CostCenterList />
      )}

      {activeTab === 'allocations' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Employee Cost Allocations</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage how employee costs are distributed across cost centers
            </p>
          </div>
          <AllocationManager mode="employee" />
        </div>
      )}

      {activeTab === 'budgets' && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Budget vs Actual</h2>
            <select className="px-4 py-2 border rounded-lg text-sm">
              <option value="2025">FY 2025</option>
              <option value="2024">FY 2024</option>
              <option value="2023">FY 2023</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Center</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { name: 'Operations', budget: 5000000000, actual: 4200000000 },
                  { name: 'Engineering', budget: 4000000000, actual: 3800000000 },
                  { name: 'Sales', budget: 3000000000, actual: 3200000000 },
                  { name: 'Marketing', budget: 2000000000, actual: 1900000000 },
                  { name: 'Finance', budget: 1200000000, actual: 1100000000 },
                ].map((item) => {
                  const variance = item.budget - item.actual;
                  const variancePercent = ((variance / item.budget) * 100).toFixed(1);
                  const isOverBudget = variance < 0;
                  return (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-right">
                        {new Intl.NumberFormat('id-ID').format(item.budget)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {new Intl.NumberFormat('id-ID').format(item.actual)}
                      </td>
                      <td className={`px-4 py-3 text-right ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                        {isOverBudget ? '' : '+'}
                        {new Intl.NumberFormat('id-ID').format(variance)}
                        <span className="text-xs ml-1">({variancePercent}%)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          isOverBudget 
                            ? 'bg-red-100 text-red-800' 
                            : Math.abs(Number(variancePercent)) < 5 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {isOverBudget ? 'Over Budget' : Math.abs(Number(variancePercent)) < 5 ? 'At Risk' : 'On Track'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Labor Cost by Department</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <PieChart className="h-12 w-12 text-gray-300" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Cost Breakdown by Type</h3>
            <div className="space-y-3">
              {[
                { type: 'Salary', amount: 8500000000, percent: 66 },
                { type: 'Allowances', amount: 2000000000, percent: 16 },
                { type: 'Insurance', amount: 1200000000, percent: 9 },
                { type: 'Overtime', amount: 800000000, percent: 6 },
                { type: 'Others', amount: 300000000, percent: 3 },
              ].map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.type}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(item.amount)} ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Monthly Labor Cost Trend</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <TrendingUp className="h-12 w-12 text-gray-300" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
