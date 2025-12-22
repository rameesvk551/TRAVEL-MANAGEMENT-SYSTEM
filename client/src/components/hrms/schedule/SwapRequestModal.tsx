import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Calendar,
  Clock,
  User,
  MessageSquare,
  Send
} from 'lucide-react';
import { useCreateSwapRequest, useShifts } from '../../../hooks/hrms/useSchedule';
import { useEmployees } from '../../../hooks/hrms/useEmployees';
import type { RosterEntry } from '../../../api/hrms/scheduleApi';

interface SwapRequestModalProps {
  entry: RosterEntry;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SwapRequestModal: React.FC<SwapRequestModalProps> = ({
  entry,
  onClose,
  onSuccess,
}) => {
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [targetRosterEntryId, _setTargetRosterEntryId] = useState('');
  const [reason, setReason] = useState('');

  const { data: employeesData } = useEmployees();
  const { data: shifts = [] } = useShifts();
  const createSwapMutation = useCreateSwapRequest();

  // Extract employees array from paginated response
  const employees = employeesData?.data || [];

  const currentShift = shifts.find(s => s.id === entry.shiftId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSwapMutation.mutateAsync({
        requesterRosterEntryId: entry.id,
        targetEmployeeId,
        targetRosterEntryId: targetRosterEntryId || entry.id, // Use same entry ID as fallback for open swap requests
        reason,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create swap request:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowLeftRight className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Request Shift Swap
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Current Shift Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Your Current Shift</div>
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-lg"
              style={{ 
                backgroundColor: `${currentShift?.color || '#3B82F6'}20`,
              }}
            >
              <Clock 
                className="h-6 w-6" 
                style={{ color: currentShift?.color || '#3B82F6' }}
              />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {currentShift?.name || 'Unknown Shift'}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(entry.date)}
              </div>
              {currentShift && (
                <div className="text-sm text-gray-500">
                  {formatTime(currentShift.startTime)} - {formatTime(currentShift.endTime)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="h-4 w-4 inline mr-1" />
              Request Swap With *
            </label>
            <select
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select employee...</option>
              {employees
                .filter(emp => emp.id !== entry.employeeId)
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.employeeType}
                  </option>
                ))
              }
            </select>
            <p className="text-xs text-gray-500 mt-1">
              The selected employee will receive a notification to approve or decline the swap
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Reason for Swap *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              placeholder="Please explain why you need to swap this shift..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <strong>Note:</strong> Once submitted, the target employee will need to approve 
            the swap. After their approval, a manager will make the final decision.
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSwapMutation.isPending || !targetEmployeeId || !reason}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SwapRequestModal;
