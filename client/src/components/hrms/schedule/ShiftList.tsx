import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Sun,
  Moon,
  Sunrise,
  Coffee
} from 'lucide-react';
import { cn } from '../../../utils';
import { useShifts, useDeleteShift } from '../../../hooks/hrms/useSchedule';
import type { Shift } from '../../../api/hrms/scheduleApi';

interface ShiftListProps {
  onCreateNew: () => void;
  onEdit: (shift: Shift) => void;
}

const shiftIcons: Record<string, React.ElementType> = {
  MORNING: Sunrise,
  AFTERNOON: Sun,
  NIGHT: Moon,
  REGULAR: Coffee,
};

const shiftColors: Record<string, { bg: string; text: string; border: string }> = {
  MORNING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  AFTERNOON: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  NIGHT: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  REGULAR: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export const ShiftList: React.FC<ShiftListProps> = ({ onCreateNew, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: shifts = [], isLoading } = useShifts();
  const deleteMutation = useDeleteShift();

  const filteredShifts = shifts.filter(shift =>
    shift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateDuration = (start: string, end: string, breakMinutes: number = 0) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
    totalMinutes -= breakMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shift Definitions</h2>
          <p className="text-sm text-gray-500">Manage work shift templates</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Shift
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search shifts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Shifts Grid */}
      {filteredShifts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No shifts defined</h3>
          <p className="text-gray-500 mb-4">Create shift templates for scheduling</p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Shift
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShifts.map((shift) => {
            const colors = shiftColors[shift.code] || shiftColors.REGULAR;
            const Icon = shiftIcons[shift.code] || Clock;

            return (
              <div
                key={shift.id}
                className={cn(
                  'rounded-lg border p-4',
                  colors.bg,
                  colors.border
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg bg-white', colors.text)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{shift.name}</h3>
                      <span className={cn('text-xs font-medium', colors.text)}>
                        {shift.code}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(shift)}
                      className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">
                      {calculateDuration(shift.startTime, shift.endTime, shift.breakDuration)}
                    </span>
                  </div>
                  {shift.breakDuration > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Break:</span>
                      <span className="font-medium text-gray-900">{shift.breakDuration} min</span>
                    </div>
                  )}
                </div>

                {!shift.isActive && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Inactive
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShiftList;
