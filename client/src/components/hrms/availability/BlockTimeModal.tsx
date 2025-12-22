// components/hrms/availability/BlockTimeModal.tsx
// Modal for blocking employee time/availability

import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { useCreateAvailability, useCreateBulkAvailability } from '../../../hooks/hrms/useAvailability';
import { useEmployees } from '../../../hooks/hrms/useEmployees';
import { cn } from '../../../utils/cn';

interface BlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string;
  initialDate?: string;
}

type BlockStatus = 'UNAVAILABLE' | 'BLOCKED' | 'TENTATIVE';
type BlockReason = 'PERSONAL' | 'TRAINING' | 'MEDICAL' | 'OTHER';

export function BlockTimeModal({ isOpen, onClose, employeeId, initialDate }: BlockTimeModalProps) {
  const [formData, setFormData] = useState({
    employeeId: employeeId || '',
    startDate: initialDate || new Date().toISOString().split('T')[0],
    endDate: initialDate || new Date().toISOString().split('T')[0],
    status: 'BLOCKED' as BlockStatus,
    blockReason: 'PERSONAL' as BlockReason,
    notes: '',
  });
  const [isMultipleDays, setIsMultipleDays] = useState(false);

  const { data: employeesData } = useEmployees();
  const employees = employeesData?.data || [];
  const createAvailability = useCreateAvailability();
  const createBulkAvailability = useCreateBulkAvailability();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMultipleDays && formData.startDate !== formData.endDate) {
      // Generate array of dates
      const dates: string[] = [];
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      await createBulkAvailability.mutateAsync({
        employeeId: formData.employeeId,
        dates,
        status: formData.status,
        blockReason: formData.blockReason,
        notes: formData.notes,
      });
    } else {
      await createAvailability.mutateAsync({
        employeeId: formData.employeeId,
        date: formData.startDate,
        status: formData.status,
        blockReason: formData.blockReason,
        notes: formData.notes,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  const isLoading = createAvailability.isPending || createBulkAvailability.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Block Time
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
              className="w-full border rounded-md px-3 py-2"
              required
              disabled={!!employeeId}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="multipleDays"
              checked={isMultipleDays}
              onChange={(e) => setIsMultipleDays(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="multipleDays" className="text-sm text-gray-700">
              Block multiple days
            </label>
          </div>

          {/* Date Selection */}
          <div className={cn('grid gap-4', isMultipleDays ? 'grid-cols-2' : 'grid-cols-1')}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isMultipleDays ? 'Start Date *' : 'Date *'}
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  startDate: e.target.value,
                  endDate: isMultipleDays ? prev.endDate : e.target.value
                }))}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            {isMultipleDays && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={formData.startDate}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as BlockStatus }))}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="BLOCKED">Blocked</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="TENTATIVE">Tentative</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <select
              value={formData.blockReason}
              onChange={(e) => setFormData(prev => ({ ...prev, blockReason: e.target.value as BlockReason }))}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="PERSONAL">Personal</option>
              <option value="TRAINING">Training</option>
              <option value="MEDICAL">Medical</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded-md px-3 py-2"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">
              Blocking time will prevent this employee from being assigned to trips during this period.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Block Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BlockTimeModal;
