/**
 * Schedule Management Page
 * Manage shifts, rosters, and swap requests
 */
import { useState } from 'react';
import { 
  ShiftList, 
  ShiftFormModal, 
  RosterCalendar, 
  SwapRequestModal 
} from '@/components/hrms';
import type { Shift, RosterEntry } from '@/api/hrms/scheduleApi';

type TabType = 'roster' | 'shifts' | 'swap-requests';

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<TabType>('roster');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedRosterEntry, setSelectedRosterEntry] = useState<RosterEntry | null>(null);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'roster', label: 'Roster Calendar' },
    { id: 'shifts', label: 'Manage Shifts' },
    { id: 'swap-requests', label: 'Swap Requests' },
  ];

  const handleCreateShift = () => {
    setSelectedShift(null);
    setShowShiftModal(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setShowShiftModal(true);
  };

  const handleCloseShiftModal = () => {
    setShowShiftModal(false);
    setSelectedShift(null);
  };

  const handleCloseSwapModal = () => {
    setShowSwapModal(false);
    setSelectedRosterEntry(null);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
            <p className="text-gray-500 mt-1">
              Manage shifts, rosters, and schedule swaps
            </p>
          </div>
          {activeTab === 'shifts' && (
            <button
              onClick={handleCreateShift}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Shift
            </button>
          )}
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
        {activeTab === 'roster' && (
          <RosterCalendar 
            onAddEntry={(date, employeeId) => {
              console.log('Add entry for', date, employeeId);
              // TODO: Open roster entry modal
            }}
            onEditEntry={(entry) => {
              setSelectedRosterEntry(entry);
              setShowSwapModal(true);
            }}
          />
        )}

        {activeTab === 'shifts' && (
          <ShiftList 
            onCreateNew={handleCreateShift}
            onEdit={handleEditShift}
          />
        )}

        {activeTab === 'swap-requests' && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Swap Requests</h2>
            <p className="text-gray-500">
              View and manage shift swap requests. Coming soon...
            </p>
          </div>
        )}

        {/* Shift Modal */}
        {showShiftModal && (
          <ShiftFormModal
            shift={selectedShift}
            onClose={handleCloseShiftModal}
            onSuccess={handleCloseShiftModal}
          />
        )}

        {/* Swap Request Modal */}
        {showSwapModal && selectedRosterEntry && (
          <SwapRequestModal
            entry={selectedRosterEntry}
            onClose={handleCloseSwapModal}
            onSuccess={handleCloseSwapModal}
          />
        )}
      </div>
    </div>
  );
}
