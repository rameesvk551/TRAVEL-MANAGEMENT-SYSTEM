// infrastructure/repositories/hrms/AttendanceRepository.ts
// PostgreSQL implementation of Attendance repository

import { Pool } from 'pg';
import {
  AttendanceRecord,
  AttendanceType,
  AttendanceStatus,
  CheckInRecord,
} from '../../../domain/entities/hrms/Attendance';
import {
  IAttendanceRepository,
  AttendanceFilters,
  AttendanceSummary,
} from '../../../domain/interfaces/hrms/IAttendanceRepository';

export class AttendanceRepository implements IAttendanceRepository {
  constructor(private pool: Pool) {}

  async findById(id: string, tenantId: string): Promise<AttendanceRecord | null> {
    const query = `
      SELECT * FROM hrms.attendance 
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByEmployeeAndDate(
    employeeId: string,
    date: Date,
    tenantId: string
  ): Promise<AttendanceRecord | null> {
    const query = `
      SELECT * FROM hrms.attendance 
      WHERE employee_id = $1 AND date = $2 AND tenant_id = $3
    `;
    const result = await this.pool.query(query, [employeeId, date, tenantId]);
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findAll(
    tenantId: string,
    filters: AttendanceFilters
  ): Promise<AttendanceRecord[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.employeeId) {
      conditions.push(`employee_id = $${paramIndex++}`);
      params.push(filters.employeeId);
    }
    if (filters.branchId) {
      conditions.push(`employee_id IN (
        SELECT id FROM hrms.employees WHERE branch_id = $${paramIndex++}
      )`);
      params.push(filters.branchId);
    }
    if (filters.dateFrom) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }
    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(filters.type);
    }
    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters.tripId) {
      conditions.push(`trip_id = $${paramIndex++}`);
      params.push(filters.tripId);
    }

    const query = `
      SELECT * FROM hrms.attendance 
      WHERE ${conditions.join(' AND ')}
      ORDER BY date DESC, created_at DESC
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.toDomain(row));
  }

  async create(
    record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AttendanceRecord> {
    const query = `
      INSERT INTO hrms.attendance (
        tenant_id, employee_id, date, check_in, check_out,
        work_hours, overtime_hours, type, status, source,
        trip_id, trip_day, is_manual_override, override_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      record.tenantId,
      record.employeeId,
      record.date,
      record.checkIn ? JSON.stringify(record.checkIn) : null,
      record.checkOut ? JSON.stringify(record.checkOut) : null,
      record.workHours || 0,
      record.overtimeHours || 0,
      record.type,
      record.status,
      record.source,
      record.tripId,
      record.tripDay,
      record.isManualOverride,
      record.overrideReason,
    ]);

    return this.toDomain(result.rows[0]);
  }

  async update(id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.checkIn !== undefined) {
      setClauses.push(`check_in = $${paramIndex++}`);
      params.push(data.checkIn ? JSON.stringify(data.checkIn) : null);
    }
    if (data.checkOut !== undefined) {
      setClauses.push(`check_out = $${paramIndex++}`);
      params.push(data.checkOut ? JSON.stringify(data.checkOut) : null);
    }
    if (data.workHours !== undefined) {
      setClauses.push(`work_hours = $${paramIndex++}`);
      params.push(data.workHours);
    }
    if (data.overtimeHours !== undefined) {
      setClauses.push(`overtime_hours = $${paramIndex++}`);
      params.push(data.overtimeHours);
    }
    if (data.type !== undefined) {
      setClauses.push(`type = $${paramIndex++}`);
      params.push(data.type);
    }
    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.approvedBy !== undefined) {
      setClauses.push(`approved_by = $${paramIndex++}`);
      params.push(data.approvedBy);
    }
    if (data.approvedAt !== undefined) {
      setClauses.push(`approved_at = $${paramIndex++}`);
      params.push(data.approvedAt);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.attendance 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return this.toDomain(result.rows[0]);
  }

  async getSummary(
    employeeId: string,
    tenantId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<AttendanceSummary> {
    const query = `
      SELECT 
        $1::uuid as employee_id,
        COUNT(*) FILTER (WHERE type = 'PRESENT') as present_days,
        COUNT(*) FILTER (WHERE type = 'ABSENT') as absent_days,
        COUNT(*) FILTER (WHERE type = 'HALF_DAY') as half_days,
        COUNT(*) FILTER (WHERE type = 'ON_TRIP') as trip_days,
        COUNT(*) FILTER (WHERE type = 'REST_DAY') as rest_days,
        COUNT(*) FILTER (WHERE type = 'HOLIDAY') as holidays,
        COALESCE(SUM(work_hours), 0) as total_work_hours,
        COALESCE(SUM(overtime_hours), 0) as total_overtime_hours,
        COUNT(*) FILTER (
          WHERE check_in IS NOT NULL 
          AND (check_in->>'timestamp')::time > '09:00:00'
        ) as late_arrivals
      FROM hrms.attendance
      WHERE employee_id = $1 AND tenant_id = $2 AND date BETWEEN $3 AND $4
    `;

    const result = await this.pool.query(query, [employeeId, tenantId, dateFrom, dateTo]);
    const row = result.rows[0];

    return {
      employeeId,
      period: { from: dateFrom, to: dateTo },
      presentDays: parseInt(row.present_days, 10) || 0,
      absentDays: parseInt(row.absent_days, 10) || 0,
      halfDays: parseInt(row.half_days, 10) || 0,
      tripDays: parseInt(row.trip_days, 10) || 0,
      restDays: parseInt(row.rest_days, 10) || 0,
      holidays: parseInt(row.holidays, 10) || 0,
      totalWorkHours: parseFloat(row.total_work_hours) || 0,
      totalOvertimeHours: parseFloat(row.total_overtime_hours) || 0,
      lateArrivals: parseInt(row.late_arrivals, 10) || 0,
    };
  }

  // Missing interface methods
  async delete(id: string, tenantId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM hrms.attendance WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }

  async createMany(records: Omit<AttendanceRecord, 'id'>[]): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = [];
    for (const record of records) {
      const created = await this.create(record);
      results.push(created);
    }
    return results;
  }

  async getTeamSummary(
    employeeIds: string[],
    tenantId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<AttendanceSummary[]> {
    const summaries: AttendanceSummary[] = [];
    for (const employeeId of employeeIds) {
      const summary = await this.getSummary(employeeId, tenantId, dateFrom, dateTo);
      summaries.push(summary);
    }
    return summaries;
  }

  async findByTrip(tripId: string, tenantId: string): Promise<AttendanceRecord[]> {
    const query = `
      SELECT * FROM hrms.attendance 
      WHERE trip_id = $1 AND tenant_id = $2
      ORDER BY date, employee_id
    `;
    const result = await this.pool.query(query, [tripId, tenantId]);
    return result.rows.map((row) => this.toDomain(row));
  }

  async markTripAttendance(
    tripId: string,
    employeeId: string,
    dates: Date[],
    tenantId: string
  ): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = [];
    for (let i = 0; i < dates.length; i++) {
      const record = await this.create({
        tenantId,
        employeeId,
        date: dates[i],
        type: 'ON_TRIP' as AttendanceType,
        status: 'AUTO_APPROVED' as AttendanceStatus,
        source: 'SYSTEM',
        tripId,
        tripDay: i + 1,
        workHours: 8,
        overtimeHours: 0,
        isManualOverride: false,
      });
      results.push(record);
    }
    return results;
  }

  async createBulkForTrip(
    employeeIds: string[],
    tripId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<void> {
    const current = new Date(startDate);
    const values: any[][] = [];
    let dayCount = 1;

    while (current <= endDate) {
      for (const employeeId of employeeIds) {
        values.push([
          tenantId,
          employeeId,
          new Date(current),
          'ON_TRIP',
          'AUTO_APPROVED',
          'SYSTEM',
          tripId,
          dayCount,
        ]);
      }
      current.setDate(current.getDate() + 1);
      dayCount++;
    }

    // Batch insert
    for (const value of values) {
      await this.pool.query(`
        INSERT INTO hrms.attendance (
          tenant_id, employee_id, date, type, status, source, trip_id, trip_day
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (tenant_id, employee_id, date) DO UPDATE SET
          type = EXCLUDED.type,
          trip_id = EXCLUDED.trip_id,
          trip_day = EXCLUDED.trip_day
      `, value);
    }
  }

  async findPendingApprovals(
    approverEmployeeId: string,
    tenantId: string
  ): Promise<AttendanceRecord[]> {
    // Find attendance records pending approval where approver is manager of employee
    const query = `
      SELECT a.* FROM hrms.attendance a
      JOIN hrms.employees e ON a.employee_id = e.id AND a.tenant_id = e.tenant_id
      WHERE a.tenant_id = $1 
        AND a.status = 'PENDING_APPROVAL'
        AND e.reporting_manager_id = $2
      ORDER BY a.date DESC
    `;
    const result = await this.pool.query(query, [tenantId, approverEmployeeId]);
    return result.rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: any): AttendanceRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      employeeId: row.employee_id,
      date: new Date(row.date),
      checkIn: row.check_in 
        ? (typeof row.check_in === 'string' ? JSON.parse(row.check_in) : row.check_in)
        : undefined,
      checkOut: row.check_out
        ? (typeof row.check_out === 'string' ? JSON.parse(row.check_out) : row.check_out)
        : undefined,
      workHours: parseFloat(row.work_hours) || 0,
      overtimeHours: parseFloat(row.overtime_hours) || 0,
      type: row.type as AttendanceType,
      status: row.status as AttendanceStatus,
      source: row.source,
      tripId: row.trip_id,
      tripDay: row.trip_day,
      isManualOverride: row.is_manual_override,
      overrideReason: row.override_reason,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
