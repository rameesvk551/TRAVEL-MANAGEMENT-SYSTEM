// components/hrms/availability/AvailabilityList.tsx
// List view for employee availability

import React, { useState } from 'react';
import { 
  Calendar, 
  User, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useCalendarEntries } from '../../../hooks/hrms/useAvailability';
import { cn } from '../../../utils/cn';
import type { CalendarEntry } from '../../../api/hrms/availabilityApi';

interface AvailabilityListProps {
  employeeId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  UNAVAILABLE: { label: 'Unavailable', color: 'bg-red-100 text-red-700', icon: XCircle },
  BLOCKED: { label: 'Blocked', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
  ON_LEAVE: { label: 'On Leave', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  ON_TRIP: { label: 'On Trip', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  TENTATIVE: { label: 'Tentative', color: 'bg-purple-100 text-purple-700', icon: AlertCircle },
};

export function AvailabilityList({ employeeId: _employeeId }: AvailabilityListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Get date range for the next 30 days
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);

  const { data: records = [], isLoading } = useCalendarEntries({
    startDate: today.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  });

  const filteredRecords = records.filter((record: CalendarEntry) => {
    if (searchTerm && !record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && record.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Records */}
      {filteredRecords.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No availability records found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filters'
              : 'No records for the selected period'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record: CalendarEntry, index: number) => {
                const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.UNAVAILABLE;
                const StatusIcon = status.icon;

                return (
                  <tr key={`${record.employeeId}-${record.date}-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {record.employeeName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          status.color
                        )}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.reason || record.tripName || record.leaveType || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {'-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AvailabilityList;
