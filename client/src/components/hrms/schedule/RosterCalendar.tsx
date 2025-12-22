import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Users,
  Clock,
  Filter
} from 'lucide-react';
import { cn } from '../../../utils';
import { useRosterEntries, useShifts } from '../../../hooks/hrms/useSchedule';
import { useEmployees } from '../../../hooks/hrms/useEmployees';
import type { RosterEntry, Shift } from '../../../api/hrms/scheduleApi';

interface RosterCalendarProps {
  rosterId?: string;
  onAddEntry: (date: string, employeeId?: string) => void;
  onEditEntry: (entry: RosterEntry) => void;
}

export const RosterCalendar: React.FC<RosterCalendarProps> = ({
  rosterId,
  onAddEntry,
  onEditEntry,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const { data: employeesData } = useEmployees();
  const { data: shifts = [] } = useShifts();
  const { data: entries = [] } = useRosterEntries(rosterId || '', {
    enabled: !!rosterId,
  });

  // Extract employees array from paginated response
  const employees = employeesData?.data || [];

  const shiftMap = useMemo(() => {
    const map: Record<string, Shift> = {};
    shifts.forEach(shift => { map[shift.id] = shift; });
    return map;
  }, [shifts]);

  // Get week dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  // Filter entries by employee if selected
  const filteredEntries = useMemo(() => {
    if (selectedEmployee === 'all') return entries;
    return entries.filter(e => e.employeeId === selectedEmployee);
  }, [entries, selectedEmployee]);

  // Group entries by date and employee
  const entriesByDateEmployee = useMemo(() => {
    const map: Record<string, Record<string, RosterEntry[]>> = {};
    filteredEntries.forEach(entry => {
      const dateKey = entry.date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = {};
      if (!map[dateKey][entry.employeeId]) map[dateKey][entry.employeeId] = [];
      map[dateKey][entry.employeeId].push(entry);
    });
    return map;
  }, [filteredEntries]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDayHeader = (date: Date) => {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const num = date.getDate();
    return { day, num };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getShiftColor = (shiftId: string) => {
    const shift = shiftMap[shiftId];
    return shift?.color || '#3B82F6';
  };

  // Get unique employees from entries
  const activeEmployees = useMemo(() => {
    const empIds = new Set(entries.map(e => e.employeeId));
    return employees.filter(emp => empIds.has(emp.id));
  }, [entries, employees]);

  const displayEmployees = selectedEmployee === 'all' 
    ? activeEmployees.length > 0 ? activeEmployees : employees.slice(0, 10)
    : employees.filter(e => e.id === selectedEmployee);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900">
                {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-3 bg-gray-50 border-r border-gray-200">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Users className="h-4 w-4" />
              Employee
            </div>
          </div>
          {weekDates.map((date, index) => {
            const { day, num } = formatDayHeader(date);
            return (
              <div
                key={index}
                className={cn(
                  'p-3 text-center border-r border-gray-200 last:border-r-0',
                  isToday(date) ? 'bg-blue-50' : 'bg-gray-50'
                )}
              >
                <div className="text-xs font-medium text-gray-500">{day}</div>
                <div className={cn(
                  'text-lg font-semibold',
                  isToday(date) ? 'text-blue-600' : 'text-gray-900'
                )}>
                  {num}
                </div>
              </div>
            );
          })}
        </div>

        {/* Employee Rows */}
        {displayEmployees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No employees to display</p>
          </div>
        ) : (
          displayEmployees.map((employee) => (
            <div key={employee.id} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0">
              {/* Employee Name */}
              <div className="p-3 border-r border-gray-200 bg-white">
                <div className="font-medium text-gray-900 text-sm">
                  {employee.firstName} {employee.lastName}
                </div>
                <div className="text-xs text-gray-500">{employee.employeeType}</div>
              </div>

              {/* Day Cells */}
              {weekDates.map((date, dayIndex) => {
                const dateKey = formatDateKey(date);
                const dayEntries = entriesByDateEmployee[dateKey]?.[employee.id] || [];

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      'p-2 border-r border-gray-200 last:border-r-0 min-h-[80px]',
                      isToday(date) ? 'bg-blue-50/30' : 'bg-white',
                      'hover:bg-gray-50 cursor-pointer transition-colors'
                    )}
                    onClick={() => dayEntries.length === 0 && onAddEntry(dateKey, employee.id)}
                  >
                    {dayEntries.length > 0 ? (
                      <div className="space-y-1">
                        {dayEntries.map((entry) => {
                          const shift = shiftMap[entry.shiftId];
                          return (
                            <div
                              key={entry.id}
                              onClick={(e) => { e.stopPropagation(); onEditEntry(entry); }}
                              className="p-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ 
                                backgroundColor: `${getShiftColor(entry.shiftId)}20`,
                                borderLeft: `3px solid ${getShiftColor(entry.shiftId)}`
                              }}
                            >
                              <div className="font-medium" style={{ color: getShiftColor(entry.shiftId) }}>
                                {shift?.name || 'Shift'}
                              </div>
                              {shift && (
                                <div className="text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {shift.startTime?.slice(0, 5)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">Shifts:</span>
        {shifts.slice(0, 5).map((shift) => (
          <div key={shift.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: shift.color || '#3B82F6' }}
            />
            <span className="text-gray-700">{shift.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RosterCalendar;
