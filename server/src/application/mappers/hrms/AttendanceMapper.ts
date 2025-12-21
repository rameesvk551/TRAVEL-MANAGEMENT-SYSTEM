// application/mappers/hrms/AttendanceMapper.ts
// Maps between Attendance domain entity and DTOs

import {
  AttendanceRecord,
  AttendanceType,
  AttendanceStatus,
} from '../../../domain/entities/hrms/Attendance';
import { AttendanceSummary } from '../../../domain/interfaces/hrms/IAttendanceRepository';
import {
  AttendanceResponseDTO,
  AttendanceSummaryDTO,
  AttendanceCalendarDTO,
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_STATUS_LABELS,
} from '../../dtos/hrms/AttendanceDTO';

export class AttendanceMapper {
  private static DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ];

  static toResponseDTO(
    record: AttendanceRecord,
    resolved?: {
      employeeName?: string;
      employeeCode?: string;
      tripName?: string;
      approvedByName?: string;
    }
  ): AttendanceResponseDTO {
    return {
      id: record.id,
      employeeId: record.employeeId,
      employeeName: resolved?.employeeName || '',
      employeeCode: resolved?.employeeCode || '',
      date: record.date.toISOString().split('T')[0],
      dayOfWeek: this.DAY_NAMES[record.date.getDay()],
      checkInTime: record.checkIn?.timestamp.toISOString(),
      checkInMode: record.checkIn?.mode,
      checkInLocation: record.checkIn?.locationName,
      checkOutTime: record.checkOut?.timestamp.toISOString(),
      checkOutMode: record.checkOut?.mode,
      checkOutLocation: record.checkOut?.locationName,
      workHours: record.workHours,
      workHoursFormatted: this.formatHours(record.workHours),
      overtimeHours: record.overtimeHours,
      type: record.type,
      typeLabel: ATTENDANCE_TYPE_LABELS[record.type],
      status: record.status,
      statusLabel: ATTENDANCE_STATUS_LABELS[record.status],
      tripId: record.tripId,
      tripName: resolved?.tripName,
      tripDay: record.tripDay,
      source: record.source,
      isManualOverride: record.isManualOverride,
      overrideReason: record.overrideReason,
      approvedBy: record.approvedBy,
      approvedByName: resolved?.approvedByName,
    };
  }

  static toSummaryDTO(
    summary: AttendanceSummary,
    dateFrom: Date,
    dateTo: Date,
    employeeName?: string
  ): AttendanceSummaryDTO {
    const totalDays = 
      summary.presentDays + 
      summary.absentDays + 
      summary.halfDays + 
      summary.tripDays + 
      summary.restDays + 
      summary.holidays;

    const workingDays = summary.presentDays + summary.tripDays;

    return {
      employeeId: summary.employeeId,
      employeeName: employeeName || '',
      period: {
        from: dateFrom.toISOString().split('T')[0],
        to: dateTo.toISOString().split('T')[0],
        label: this.formatPeriodLabel(dateFrom, dateTo),
      },
      totalDays,
      presentDays: summary.presentDays,
      absentDays: summary.absentDays,
      halfDays: summary.halfDays,
      tripDays: summary.tripDays,
      restDays: summary.restDays,
      holidays: summary.holidays,
      leaveDays: 0, // Calculated from leave service
      totalWorkHours: summary.totalWorkHours,
      averageWorkHours: totalDays > 0 
        ? Math.round((summary.totalWorkHours / workingDays) * 10) / 10 
        : 0,
      totalOvertimeHours: summary.totalOvertimeHours,
      lateArrivals: summary.lateArrivals,
      earlyDepartures: 0,
      attendancePercentage: totalDays > 0 
        ? Math.round((workingDays / totalDays) * 1000) / 10 
        : 0,
    };
  }

  static toCalendarDTO(
    record: AttendanceRecord | null,
    date: Date,
    resolved?: {
      tripName?: string;
      isHoliday?: boolean;
      holidayName?: string;
    }
  ): AttendanceCalendarDTO {
    return {
      date: date.toISOString().split('T')[0],
      type: record?.type || 'ABSENT',
      status: record?.status || 'PENDING',
      workHours: record?.workHours,
      tripName: resolved?.tripName,
      isWeekend: [0, 6].includes(date.getDay()),
      isHoliday: resolved?.isHoliday || false,
      holidayName: resolved?.holidayName,
    };
  }

  static buildCalendar(
    records: AttendanceRecord[],
    year: number,
    month: number,
    holidays: Map<string, string> = new Map()
  ): AttendanceCalendarDTO[] {
    const calendar: AttendanceCalendarDTO[] = [];
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const recordMap = new Map(
      records.map(r => [r.date.toISOString().split('T')[0], r])
    );

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const record = recordMap.get(dateStr) || null;
      const holidayName = holidays.get(dateStr);

      calendar.push(this.toCalendarDTO(record, new Date(current), {
        isHoliday: !!holidayName,
        holidayName,
      }));

      current.setDate(current.getDate() + 1);
    }

    return calendar;
  }

  private static formatHours(hours?: number): string {
    if (!hours) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  private static formatPeriodLabel(from: Date, to: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    if (from.getMonth() === to.getMonth() && 
        from.getFullYear() === to.getFullYear()) {
      return `${months[from.getMonth()]} ${from.getFullYear()}`;
    }
    
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  }
}
