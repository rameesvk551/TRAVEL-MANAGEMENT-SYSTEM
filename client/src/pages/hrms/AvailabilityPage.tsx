/**
 * Availability Management Page
 * View and manage employee availability and blocked time
 */
import { useState } from 'react';
import { AvailabilityCalendar, BlockTimeModal, AvailabilityList } from '@/components/hrms';

type TabType = 'calendar' | 'list' | 'my-availability';

export default function AvailabilityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [showBlockModal, setShowBlockModal] = useState(false);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'calendar', label: 'Calendar View' },
    { id: 'list', label: 'All Availability' },
    { id: 'my-availability', label: 'My Availability' },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Availability Management</h1>
            <p className="text-gray-500 mt-1">
              View and manage team availability, block time, and scheduling
            </p>
          </div>
          <button
            onClick={() => setShowBlockModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Block Time
          </button>
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

        {/* Tab Content */}
        {activeTab === 'calendar' && (
          <AvailabilityCalendar 
            onAddAvailability={() => setShowBlockModal(true)}
          />
        )}

        {activeTab === 'list' && (
          <AvailabilityList />
        )}

        {activeTab === 'my-availability' && (
          <AvailabilityList employeeId="current" />
        )}

        {/* Block Time Modal */}
        {showBlockModal && (
          <BlockTimeModal
            isOpen={showBlockModal}
            onClose={() => setShowBlockModal(false)}
          />
        )}
      </div>
    </div>
  );
}
