// pages/hrms/PayrollExportPage.tsx
// Payroll Export Management Page

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  History,
  Settings,
} from 'lucide-react';
import {
  ExportTemplateList,
  ExportWizard,
  ExportHistory,
} from '../../components/hrms/payrollExport';

type Tab = 'export' | 'history' | 'templates';

export function PayrollExportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('export');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'export', label: 'New Export', icon: <Download className="h-4 w-4" /> },
    { id: 'history', label: 'Export History', icon: <History className="h-4 w-4" /> },
    { id: 'templates', label: 'Templates', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileSpreadsheet className="h-7 w-7 text-blue-600" />
          Payroll Export
        </h1>
        <p className="mt-1 text-gray-500">
          Generate payroll exports for bank transfers, tax reports, and more
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">24</div>
              <div className="text-sm text-gray-500">Exports This Month</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-gray-500">Active Templates</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-gray-500">Employees Exported</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Download className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">1.2B</div>
              <div className="text-sm text-gray-500">Total Exported (IDR)</div>
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
      {activeTab === 'export' && (
        <ExportWizard />
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border p-6">
          <ExportHistory />
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white rounded-lg border p-6">
          <ExportTemplateList />
        </div>
      )}
    </div>
  );
}
