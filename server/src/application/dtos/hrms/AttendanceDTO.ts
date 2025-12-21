// application/dtos/hrms/AttendanceDTO.ts
// DTOs for Attendance operations

import { 
  AttendanceType, 
  AttendanceStatus, 
  AttendanceSource,
  CheckInMode 
} from '../../../domain/entities/hrms/Attendance';

// Check-in request
export interface CheckInDTO {
  mode: CheckInMode;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAccuracy?: number;
  photoUrl?: string;
  deviceInfo?: {
    deviceId?: string;
    deviceType?: string;
    osVersion?: string;
    appVersion?: string;
  };
  // For offline sync
  offlineRecorded?: string;
}

// Check-out request
export interface CheckOutDTO {
  mode: CheckInMode;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  photoUrl?: string;
}

// Manual attendance entry
export interface ManualAttendanceDTO {
  employeeId: string;
  date: string;
  type: AttendanceType;
  checkInTime?: string;
  checkOutTime?: string;
  reason: string;
}

// Bulk attendance (for trip)
export interface TripAttendanceDTO {
  tripId: string;
  employeeIds: string[];
  startDate: string;
  endDate: string;
  includeRestDays?: boolean;
}

// Approval
export interface ApproveAttendanceDTO {
  recordIds: string[];
  action: 'approve' | 'reject';
  comment?: string;
}

// Response DTO
export interface AttendanceResponseDTO {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  
  date: string;
  dayOfWeek: string;
  
  // Check-in/out
  checkInTime?: string;
  checkInMode?: CheckInMode;
  checkInLocation?: string;
  
  checkOutTime?: string;
  checkOutMode?: CheckInMode;
  checkOutLocation?: string;
  
  // Calculated
  workHours: number;
  workHoursFormatted: string;
  overtimeHours: number;
  
  // Classification
  type: AttendanceType;
  typeLabel: string;
  status: AttendanceStatus;
  statusLabel: string;
  
  // Trip info
  tripId?: string;
  tripName?: string;
  tripDay?: number;
  
  // Audit
  source: AttendanceSource;
  isManualOverride: boolean;
  overrideReason?: string;
  approvedBy?: string;
  approvedByName?: string;
}

// Summary DTO
export interface AttendanceSummaryDTO {
  employeeId: string;
  employeeName: string;
  period: {
    from: string;
    to: string;
    label: string;  // "December 2025"
  };
  
  // Counts
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  tripDays: number;
  restDays: number;
  holidays: number;
  leaveDays: number;
  
  // Hours
  totalWorkHours: number;
  averageWorkHours: number;
  totalOvertimeHours: number;
  
  // Punctuality
  lateArrivals: number;
  earlyDepartures: number;
  
  // Percentage
  attendancePercentage: number;
}

// Calendar view DTO
export interface AttendanceCalendarDTO {
  date: string;
  type: AttendanceType;
  status: AttendanceStatus;
  workHours?: number;
  tripName?: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

// Labels
export const ATTENDANCE_TYPE_LABELS: Record<AttendanceType, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
  ON_TRIP: 'On Trip',
  REST_DAY: 'Rest Day',
  WEEK_OFF: 'Week Off',
  HOLIDAY: 'Holiday',
  WORK_FROM_HOME: 'WFH',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  AUTO_APPROVED: 'Auto Approved',
};
