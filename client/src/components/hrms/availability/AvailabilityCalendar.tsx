// components/hrms/availability/AvailabilityCalendar.tsx
// Calendar view for employee availability

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Plane, 
  Clock, 
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useCalendarEntries, useTeamSummary } from '../../../hooks/hrms/useAvailability';
import { cn } from '../../../utils/cn';
import { CalendarEntry, TeamSummary } from '../../../api/hrms/availabilityApi';

interface AvailabilityCalendarProps {
  onAddAvailability?: () => void;
  onViewDetails?: (entry: CalendarEntry) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  UNAVAILABLE: 'bg-red-100 text-red-800 border-red-200',
  BLOCKED: 'bg-gray-100 text-gray-800 border-gray-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ON_TRIP: 'bg-blue-100 text-blue-800 border-blue-200',
  TENTATIVE: 'bg-purple-100 text-purple-800 border-purple-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  AVAILABLE: <Users className="w-3 h-3" />,
  ON_TRIP: <Plane className="w-3 h-3" />,
  ON_LEAVE: <Clock className="w-3 h-3" />,
  UNAVAILABLE: <AlertCircle className="w-3 h-3" />,
};

export function AvailabilityCalendar({ onAddAvailability, onViewDetails }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Calculate date range for current month view
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    };
  }, [currentDate]);

  const { data: calendarEntries = [], isLoading } = useCalendarEntries({
    ...dateRange,
    branchId: selectedBranch || undefined,
  });

  const { data: teamSummary = [] } = useTeamSummary({
    ...dateRange,
    branchId: selectedBranch || undefined,
  });

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    calendarEntries.forEach(entry => {
      const existing = map.get(entry.date) || [];
      map.set(entry.date, [...existing, entry]);
    });
    return map;
  }, [calendarEntries]);

  // Get summary for a date
  const getSummaryForDate = (date: string): TeamSummary | undefined => {
    return teamSummary.find(s => s.date === date);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const isToday = (date: Date) => formatDate(date) === formatDate(new Date());

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Availability Calendar
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium min-w-[150px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="ml-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Today
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-sm border rounded-md px-3 py-1.5"
          >
            <option value="">All Branches</option>
            {/* Add branch options */}
          </select>

          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-3 py-1.5 text-sm',
                viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
              )}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm',
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
              )}
            >
              List
            </button>
          </div>

          {onAddAvailability && (
            <button
              onClick={onAddAvailability}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Block Time
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-4 text-sm">
        <span className="text-gray-500">Legend:</span>
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <span key={status} className={cn('px-2 py-0.5 rounded text-xs', colors)}>
            {status.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      {viewMode === 'calendar' && (
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = formatDate(date);
              const entries = entriesByDate.get(dateStr) || [];
              const summary = getSummaryForDate(dateStr);
              const today = isToday(date);

              return (
                <div
                  key={idx}
                  className={cn(
                    'min-h-[100px] border rounded-lg p-1 transition-colors',
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                    today && 'ring-2 ring-blue-500',
                    'hover:bg-gray-50 cursor-pointer'
                  )}
                >
                  <div className={cn(
                    'text-sm font-medium mb-1 flex items-center justify-between',
                    !isCurrentMonth && 'text-gray-400',
                    today && 'text-blue-600'
                  )}>
                    <span>{date.getDate()}</span>
                    {summary && isCurrentMonth && (
                      <span className="text-xs text-gray-500">
                        {summary.available}/{summary.totalStaff}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden max-h-[70px]">
                    {entries.slice(0, 3).map((entry, i) => (
                      <div
                        key={i}
                        onClick={() => onViewDetails?.(entry)}
                        className={cn(
                          'text-xs px-1 py-0.5 rounded truncate flex items-center gap-1',
                          STATUS_COLORS[entry.status] || 'bg-gray-100'
                        )}
                        title={`${entry.employeeName}: ${entry.status}`}
                      >
                        {STATUS_ICONS[entry.status]}
                        <span className="truncate">{entry.employeeName}</span>
                      </div>
                    ))}
                    {entries.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{entries.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : calendarEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No availability data for this period</div>
          ) : (
            <div className="space-y-2">
              {Array.from(entriesByDate.entries()).map(([date, entries]) => (
                <div key={date} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-medium text-sm">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="divide-y">
                    {entries.map((entry, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                        onClick={() => onViewDetails?.(entry)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            STATUS_COLORS[entry.status]
                          )}>
                            {STATUS_ICONS[entry.status] || <Users className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{entry.employeeName}</div>
                            <div className="text-xs text-gray-500">
                              {entry.reason || entry.tripName || entry.leaveType || entry.status}
                            </div>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded text-xs',
                          STATUS_COLORS[entry.status]
                        )}>
                          {entry.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AvailabilityCalendar;
