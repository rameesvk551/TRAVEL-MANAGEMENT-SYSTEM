// pages/hrms/ApprovalChainsPage.tsx
// Approval Workflow Management Page

import React, { useState } from 'react';
import {
  GitBranch,
  Settings,
  Clock,
} from 'lucide-react';
import { ApprovalChainList } from '../../components/hrms/approval';

type Tab = 'chains' | 'requests' | 'settings';

export function ApprovalChainsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chains');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'chains', label: 'Approval Chains', icon: <GitBranch className="h-4 w-4" /> },
    { id: 'requests', label: 'Pending Requests', icon: <Clock className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <GitBranch className="h-7 w-7 text-blue-600" />
          Approval Workflows
        </h1>
        <p className="mt-1 text-gray-500">
          Configure and manage approval chains for leaves, expenses, and other processes
        </p>
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
      {activeTab === 'chains' && (
        <ApprovalChainList />
      )}

      {activeTab === 'requests' && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Pending Approvals</h3>
          <p className="mt-2 text-gray-500">
            View and process pending approval requests here.
          </p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Approval Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Auto-escalation</div>
                <div className="text-sm text-gray-500">
                  Automatically escalate pending approvals after deadline
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Email notifications</div>
                <div className="text-sm text-gray-500">
                  Send email notifications for approval requests
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">Default escalation days</div>
                <div className="text-sm text-gray-500">
                  Days before escalating to next level
                </div>
              </div>
              <input
                type="number"
                defaultValue={3}
                min={1}
                max={30}
                className="w-20 px-3 py-1.5 border rounded-lg text-center"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
