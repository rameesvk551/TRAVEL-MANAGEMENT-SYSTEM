// domain/entities/hrms/Attendance.ts
// Multi-mode attendance for office and field staff

export type AttendanceType = 
  | 'PRESENT' 
  | 'ABSENT' 
  | 'HALF_DAY' 
  | 'ON_TRIP' 
  | 'REST_DAY' 
  | 'WEEK_OFF' 
  | 'HOLIDAY'
  | 'WORK_FROM_HOME';

export type AttendanceStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'AUTO_APPROVED';

export type AttendanceSource = 
  | 'PUNCH' 
  | 'MOBILE' 
  | 'TRIP_AUTO' 
  | 'MANUAL' 
  | 'IMPORT'
  | 'SYSTEM';

export type CheckInMode = 
  | 'OFFICE_PUNCH' 
  | 'MOBILE_GPS' 
  | 'QR_SCAN' 
  | 'MANUAL'
  | 'TRIP_AUTO';

export interface DeviceInfo {
  deviceId?: string;
  deviceType?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface CheckInRecord {
  timestamp: Date;
  mode: CheckInMode;
  
  // GPS
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAccuracy?: number;
  
  // Offline sync
  offlineRecorded?: Date;
  syncedAt?: Date;
  
  deviceInfo?: DeviceInfo;
  
  // Photo proof (optional)
  photoUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  
  date: Date;
  
  checkIn?: CheckInRecord;
  checkOut?: CheckInRecord;
  
  // Calculated
  workHours: number;
  overtimeHours: number;
  
  // Classification
  type: AttendanceType;
  status: AttendanceStatus;
  
  // Trip-based
  tripId?: string;
  tripDay?: number;
  
  // Audit
  source: AttendanceSource;
  isManualOverride: boolean;
  overrideReason?: string;
  approvedBy?: string;
  approvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export function createAttendanceRecord(
  params: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt' | 'workHours' | 'overtimeHours'>
): Omit<AttendanceRecord, 'id'> {
  const workHours = calculateWorkHours(params.checkIn, params.checkOut);
  const overtimeHours = calculateOvertime(workHours);
  
  return {
    ...params,
    workHours,
    overtimeHours,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function calculateWorkHours(
  checkIn?: CheckInRecord, 
  checkOut?: CheckInRecord
): number {
  if (!checkIn || !checkOut) return 0;
  
  const diffMs = checkOut.timestamp.getTime() - checkIn.timestamp.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  
  return Math.round(hours * 100) / 100;
}

export function calculateOvertime(
  workHours: number, 
  standardHours = 8
): number {
  return Math.max(0, workHours - standardHours);
}

export function isLateCheckIn(
  checkIn: CheckInRecord, 
  expectedTime = '09:00'
): boolean {
  const [hours, minutes] = expectedTime.split(':').map(Number);
  const expected = new Date(checkIn.timestamp);
  expected.setHours(hours, minutes, 0, 0);
  
  return checkIn.timestamp > expected;
}

export function isLocationValid(
  checkIn: CheckInRecord,
  expectedLat: number,
  expectedLng: number,
  radiusMeters = 100
): boolean {
  if (!checkIn.latitude || !checkIn.longitude) return false;
  
  const distance = calculateDistance(
    checkIn.latitude,
    checkIn.longitude,
    expectedLat,
    expectedLng
  );
  
  return distance <= radiusMeters;
}

function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
