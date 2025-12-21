// application/services/hrms/AttendanceService.ts
// Attendance business logic

import {
  AttendanceRecord,
  createAttendanceRecord,
  calculateWorkHours,
  isLateCheckIn,
} from '../../../domain/entities/hrms/Attendance';
import {
  IAttendanceRepository,
  AttendanceFilters,
  AttendanceSummary,
} from '../../../domain/interfaces/hrms/IAttendanceRepository';
import {
  CheckInDTO,
  CheckOutDTO,
  ManualAttendanceDTO,
  ApproveAttendanceDTO,
  AttendanceResponseDTO,
  AttendanceSummaryDTO,
  AttendanceCalendarDTO,
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_STATUS_LABELS,
} from '../../dtos/hrms/AttendanceDTO';

export class AttendanceService {
  constructor(
    private attendanceRepo: IAttendanceRepository
  ) {}

  async checkIn(
    employeeId: string,
    dto: CheckInDTO,
    tenantId: string
  ): Promise<AttendanceResponseDTO> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in
    const existing = await this.attendanceRepo.findByEmployeeAndDate(
      employeeId,
      today,
      tenantId
    );

    if (existing?.checkIn) {
      throw new Error('Already checked in today');
    }

    const checkInRecord = {
      timestamp: dto.offlineRecorded ? new Date(dto.offlineRecorded) : new Date(),
      mode: dto.mode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationName: dto.locationName,
      locationAccuracy: dto.locationAccuracy,
      offlineRecorded: dto.offlineRecorded ? new Date(dto.offlineRecorded) : undefined,
      syncedAt: new Date(),
      deviceInfo: dto.deviceInfo,
      photoUrl: dto.photoUrl,
    };

    let attendance: AttendanceRecord;

    if (existing) {
      attendance = await this.attendanceRepo.update(existing.id, {
        checkIn: checkInRecord,
        type: 'PRESENT',
        updatedAt: new Date(),
      });
    } else {
      const record = createAttendanceRecord({
        tenantId,
        employeeId,
        date: today,
        checkIn: checkInRecord,
        type: 'PRESENT',
        status: 'AUTO_APPROVED',
        source: 'MOBILE',
        isManualOverride: false,
      });
      attendance = await this.attendanceRepo.create(record);
    }

    return this.toResponseDTO(attendance);
  }

  async checkOut(
    employeeId: string,
    dto: CheckOutDTO,
    tenantId: string
  ): Promise<AttendanceResponseDTO> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.attendanceRepo.findByEmployeeAndDate(
      employeeId,
      today,
      tenantId
    );

    if (!existing?.checkIn) {
      throw new Error('No check-in found for today');
    }

    if (existing.checkOut) {
      throw new Error('Already checked out today');
    }

    const checkOutRecord = {
      timestamp: new Date(),
      mode: dto.mode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationName: dto.locationName,
      photoUrl: dto.photoUrl,
    };

    const workHours = calculateWorkHours(existing.checkIn, checkOutRecord);

    const attendance = await this.attendanceRepo.update(existing.id, {
      checkOut: checkOutRecord,
      workHours,
      overtimeHours: Math.max(0, workHours - 8),
      updatedAt: new Date(),
    });

    return this.toResponseDTO(attendance);
  }

  async createManual(
    dto: ManualAttendanceDTO,
    tenantId: string,
    createdBy: string
  ): Promise<AttendanceResponseDTO> {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    // Check for existing
    const existing = await this.attendanceRepo.findByEmployeeAndDate(
      dto.employeeId,
      date,
      tenantId
    );

    if (existing) {
      throw new Error('Attendance record already exists for this date');
    }

    let checkIn, checkOut;
    if (dto.checkInTime) {
      const [hours, minutes] = dto.checkInTime.split(':').map(Number);
      const checkInDate = new Date(date);
      checkInDate.setHours(hours, minutes, 0, 0);
      checkIn = { timestamp: checkInDate, mode: 'MANUAL' as const };
    }

    if (dto.checkOutTime) {
      const [hours, minutes] = dto.checkOutTime.split(':').map(Number);
      const checkOutDate = new Date(date);
      checkOutDate.setHours(hours, minutes, 0, 0);
      checkOut = { timestamp: checkOutDate, mode: 'MANUAL' as const };
    }

    const record = createAttendanceRecord({
      tenantId,
      employeeId: dto.employeeId,
      date,
      checkIn,
      checkOut,
      type: dto.type,
      status: 'PENDING',
      source: 'MANUAL',
      isManualOverride: true,
      overrideReason: dto.reason,
    });

    const attendance = await this.attendanceRepo.create(record);
    return this.toResponseDTO(attendance);
  }

  async approve(
    dto: ApproveAttendanceDTO,
    tenantId: string,
    approverId: string
  ): Promise<void> {
    for (const id of dto.recordIds) {
      await this.attendanceRepo.update(id, {
        status: dto.action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async getByDate(
    employeeId: string,
    date: Date,
    tenantId: string
  ): Promise<AttendanceResponseDTO | null> {
    const attendance = await this.attendanceRepo.findByEmployeeAndDate(
      employeeId,
      date,
      tenantId
    );
    if (!attendance) return null;
    return this.toResponseDTO(attendance);
  }

  async list(
    tenantId: string,
    filters: AttendanceFilters
  ): Promise<AttendanceResponseDTO[]> {
    const records = await this.attendanceRepo.findAll(tenantId, filters);
    return records.map(r => this.toResponseDTO(r));
  }

  async getSummary(
    employeeId: string,
    tenantId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<AttendanceSummaryDTO> {
    const summary = await this.attendanceRepo.getSummary(
      employeeId,
      tenantId,
      dateFrom,
      dateTo
    );
    return this.toSummaryDTO(summary, dateFrom, dateTo);
  }

  async getCalendar(
    employeeId: string,
    tenantId: string,
    year: number,
    month: number
  ): Promise<AttendanceCalendarDTO[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.attendanceRepo.findAll(tenantId, {
      employeeId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    const calendar: AttendanceCalendarDTO[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const record = records.find(
        r => r.date.toDateString() === current.toDateString()
      );

      calendar.push({
        date: current.toISOString().split('T')[0],
        type: record?.type || 'ABSENT',
        status: record?.status || 'PENDING',
        workHours: record?.workHours,
        tripName: undefined, // TODO: Get trip name
        isWeekend: [0, 6].includes(current.getDay()),
        isHoliday: false, // TODO: Check holiday
        holidayName: undefined,
      });

      current.setDate(current.getDate() + 1);
    }

    return calendar;
  }

  // Mappers
  private toResponseDTO(record: AttendanceRecord): AttendanceResponseDTO {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      id: record.id,
      employeeId: record.employeeId,
      employeeName: '', // TODO: Resolve
      employeeCode: '',
      date: record.date.toISOString().split('T')[0],
      dayOfWeek: dayNames[record.date.getDay()],
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
      tripName: undefined,
      tripDay: record.tripDay,
      source: record.source,
      isManualOverride: record.isManualOverride,
      overrideReason: record.overrideReason,
      approvedBy: record.approvedBy,
      approvedByName: undefined,
    };
  }

  private toSummaryDTO(
    summary: AttendanceSummary,
    dateFrom: Date,
    dateTo: Date
  ): AttendanceSummaryDTO {
    const totalDays = summary.presentDays + summary.absentDays + 
                      summary.halfDays + summary.tripDays + 
                      summary.restDays + summary.holidays;

    return {
      employeeId: summary.employeeId,
      employeeName: '', // TODO: Resolve
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
      leaveDays: 0, // TODO: Calculate
      totalWorkHours: summary.totalWorkHours,
      averageWorkHours: totalDays > 0 ? summary.totalWorkHours / totalDays : 0,
      totalOvertimeHours: summary.totalOvertimeHours,
      lateArrivals: summary.lateArrivals,
      earlyDepartures: 0, // TODO: Calculate
      attendancePercentage: totalDays > 0 
        ? ((summary.presentDays + summary.tripDays) / totalDays) * 100 
        : 0,
    };
  }

  private formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  private formatPeriodLabel(from: Date, to: Date): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
      return `${months[from.getMonth()]} ${from.getFullYear()}`;
    }
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  }
}
