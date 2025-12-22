// infrastructure/repositories/hrms/ScheduleRepository.ts
// Schedule Repository Implementation

import { Pool } from 'pg';
import type { 
  Shift, 
  Roster, 
  RosterEntry, 
  WorkPattern,
  ShiftSwapRequest,
  WeeklyPattern 
} from '../../../domain/entities/hrms/Schedule';
import type { 
  IScheduleRepository, 
  ShiftFilters,
  RosterFilters 
} from '../../../domain/interfaces/hrms/IScheduleRepository';

export class ScheduleRepository implements IScheduleRepository {
  constructor(private pool: Pool) {}

  // ===== SHIFTS =====
  async findShiftById(id: string): Promise<Shift | null> {
    const query = `SELECT * FROM hrms.shifts WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.mapShiftToEntity(result.rows[0]) : null;
  }

  async findAllShifts(filters: ShiftFilters): Promise<Shift[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [filters.tenantId];
    let paramIndex = 2;

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(filters.type);
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      params.push(filters.isActive);
    }

    const query = `
      SELECT * FROM hrms.shifts
      WHERE ${conditions.join(' AND ')}
      ORDER BY start_time
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapShiftToEntity(row));
  }

  async createShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const query = `
      INSERT INTO hrms.shifts (
        tenant_id, name, code, type, start_time, end_time,
        break_duration, work_hours, is_overnight, color, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      shift.tenantId,
      shift.name,
      shift.code,
      shift.type,
      shift.startTime,
      shift.endTime,
      shift.breakDuration,
      shift.workHours,
      shift.isOvernight,
      shift.color,
      shift.isActive,
    ]);

    return this.mapShiftToEntity(result.rows[0]);
  }

  async updateShift(id: string, shift: Partial<Shift>): Promise<Shift | null> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      name: 'name',
      code: 'code',
      type: 'type',
      startTime: 'start_time',
      endTime: 'end_time',
      breakDuration: 'break_duration',
      workHours: 'work_hours',
      isOvernight: 'is_overnight',
      color: 'color',
      isActive: 'is_active',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in shift) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push((shift as Record<string, unknown>)[key]);
      }
    }

    if (updates.length === 0) return this.findShiftById(id);

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.shifts SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows.length > 0 ? this.mapShiftToEntity(result.rows[0]) : null;
  }

  async deleteShift(id: string): Promise<boolean> {
    const query = `DELETE FROM hrms.shifts WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===== WORK PATTERNS =====
  async findWorkPatternById(id: string): Promise<WorkPattern | null> {
    const query = `SELECT * FROM hrms.work_patterns WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.mapWorkPatternToEntity(result.rows[0]) : null;
  }

  async findAllWorkPatterns(tenantId: string): Promise<WorkPattern[]> {
    const query = `SELECT * FROM hrms.work_patterns WHERE tenant_id = $1 ORDER BY name`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows.map(row => this.mapWorkPatternToEntity(row));
  }

  async createWorkPattern(pattern: Omit<WorkPattern, 'id'>): Promise<WorkPattern> {
    const query = `
      INSERT INTO hrms.work_patterns (
        tenant_id, name, description, pattern, is_rotating, 
        rotation_weeks, is_default, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      pattern.tenantId,
      pattern.name,
      pattern.description,
      JSON.stringify(pattern.pattern),
      pattern.isRotating,
      pattern.rotationWeeks,
      pattern.isDefault,
      pattern.isActive,
    ]);

    return this.mapWorkPatternToEntity(result.rows[0]);
  }

  async updateWorkPattern(id: string, pattern: Partial<WorkPattern>): Promise<WorkPattern | null> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (pattern.name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(pattern.name);
    }
    if (pattern.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(pattern.description);
    }
    if (pattern.pattern) {
      updates.push(`pattern = $${paramIndex++}`);
      params.push(JSON.stringify(pattern.pattern));
    }
    if (pattern.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(pattern.isActive);
    }

    if (updates.length === 0) return this.findWorkPatternById(id);

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.work_patterns SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows.length > 0 ? this.mapWorkPatternToEntity(result.rows[0]) : null;
  }

  async deleteWorkPattern(id: string): Promise<boolean> {
    const query = `DELETE FROM hrms.work_patterns WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===== ROSTERS =====
  async findRosterById(id: string): Promise<Roster | null> {
    const query = `SELECT * FROM hrms.rosters WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    const entriesQuery = `
      SELECT re.*, s.name as shift_name, CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM hrms.roster_entries re
      LEFT JOIN hrms.shifts s ON re.shift_id = s.id
      LEFT JOIN hrms.employees e ON re.employee_id = e.id
      WHERE re.roster_id = $1
      ORDER BY re.date, e.first_name
    `;
    const entriesResult = await this.pool.query(entriesQuery, [id]);

    return this.mapRosterToEntity(result.rows[0], entriesResult.rows);
  }

  async findAllRosters(filters: RosterFilters): Promise<Roster[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [filters.tenantId];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      params.push(filters.branchId);
    }

    const query = `
      SELECT * FROM hrms.rosters
      WHERE ${conditions.join(' AND ')}
      ORDER BY start_date DESC
    `;

    const result = await this.pool.query(query, params);
    const rosters: Roster[] = [];

    for (const row of result.rows) {
      const roster = await this.findRosterById(row.id);
      if (roster) rosters.push(roster);
    }

    return rosters;
  }

  async findCurrentRoster(tenantId: string, branchId?: string): Promise<Roster | null> {
    let query = `
      SELECT * FROM hrms.rosters
      WHERE tenant_id = $1 AND status = 'PUBLISHED'
        AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
    `;
    const params: unknown[] = [tenantId];

    if (branchId) {
      query += ` AND branch_id = $2`;
      params.push(branchId);
    }

    query += ` ORDER BY start_date DESC LIMIT 1`;

    const result = await this.pool.query(query, params);
    return result.rows.length > 0 ? this.findRosterById(result.rows[0].id) : null;
  }

  async createRoster(roster: Omit<Roster, 'id'>): Promise<Roster> {
    const query = `
      INSERT INTO hrms.rosters (
        tenant_id, name, description, start_date, end_date,
        branch_id, department_id, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      roster.tenantId,
      roster.name,
      roster.description,
      roster.startDate,
      roster.endDate,
      roster.branchId,
      roster.departmentId,
      roster.status,
      roster.createdBy,
    ]);

    return this.mapRosterToEntity(result.rows[0], []);
  }

  async updateRoster(id: string, roster: Partial<Roster>): Promise<Roster | null> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      status: 'status',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in roster) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push((roster as Record<string, unknown>)[key]);
      }
    }

    if (updates.length === 0) return this.findRosterById(id);

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.rosters SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    await this.pool.query(query, params);
    return this.findRosterById(id);
  }

  async publishRoster(id: string, publisherId: string): Promise<Roster | null> {
    const query = `
      UPDATE hrms.rosters
      SET status = 'PUBLISHED', published_at = NOW(), published_by = $2, updated_at = NOW()
      WHERE id = $1 AND status = 'DRAFT'
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, publisherId]);
    return result.rows.length > 0 ? this.findRosterById(id) : null;
  }

  async deleteRoster(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM hrms.roster_entries WHERE roster_id = $1`, [id]);
      const result = await client.query(`DELETE FROM hrms.rosters WHERE id = $1`, [id]);
      await client.query('COMMIT');
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===== ROSTER ENTRIES =====
  async findRosterEntryById(id: string): Promise<RosterEntry | null> {
    const query = `
      SELECT re.*, s.name as shift_name, CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM hrms.roster_entries re
      LEFT JOIN hrms.shifts s ON re.shift_id = s.id
      LEFT JOIN hrms.employees e ON re.employee_id = e.id
      WHERE re.id = $1
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.mapRosterEntryToEntity(result.rows[0]) : null;
  }

  async findRosterEntriesByEmployee(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<RosterEntry[]> {
    const query = `
      SELECT re.*, s.name as shift_name
      FROM hrms.roster_entries re
      LEFT JOIN hrms.shifts s ON re.shift_id = s.id
      WHERE re.employee_id = $1 AND re.date >= $2 AND re.date <= $3
      ORDER BY re.date
    `;
    const result = await this.pool.query(query, [employeeId, startDate, endDate]);
    return result.rows.map(row => this.mapRosterEntryToEntity(row));
  }

  async findRosterEntriesByDate(
    tenantId: string,
    date: Date,
    branchId?: string
  ): Promise<RosterEntry[]> {
    let query = `
      SELECT re.*, s.name as shift_name, CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM hrms.roster_entries re
      LEFT JOIN hrms.shifts s ON re.shift_id = s.id
      JOIN hrms.employees e ON re.employee_id = e.id
      WHERE re.tenant_id = $1 AND re.date = $2
    `;
    const params: unknown[] = [tenantId, date];

    if (branchId) {
      query += ` AND e.branch_id = $3`;
      params.push(branchId);
    }

    query += ` ORDER BY s.start_time, e.first_name`;

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapRosterEntryToEntity(row));
  }

  async createRosterEntry(entry: Omit<RosterEntry, 'id'>): Promise<RosterEntry> {
    const query = `
      INSERT INTO hrms.roster_entries (
        tenant_id, roster_id, employee_id, date, shift_id,
        actual_start_time, actual_end_time, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      entry.tenantId,
      null, // roster_id is optional
      entry.employeeId,
      entry.date,
      entry.shiftId,
      entry.actualStartTime,
      entry.actualEndTime,
      entry.status,
      entry.notes,
    ]);

    return this.findRosterEntryById(result.rows[0].id) as Promise<RosterEntry>;
  }

  async createRosterEntriesBulk(entries: Omit<RosterEntry, 'id'>[]): Promise<RosterEntry[]> {
    const results: RosterEntry[] = [];
    for (const entry of entries) {
      const created = await this.createRosterEntry(entry);
      results.push(created);
    }
    return results;
  }

  async updateRosterEntry(id: string, entry: Partial<RosterEntry>): Promise<RosterEntry | null> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      shiftId: 'shift_id',
      actualStartTime: 'actual_start_time',
      actualEndTime: 'actual_end_time',
      status: 'status',
      notes: 'notes',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in entry) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push((entry as Record<string, unknown>)[key]);
      }
    }

    if (updates.length === 0) return this.findRosterEntryById(id);

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.roster_entries SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows.length > 0 ? this.findRosterEntryById(id) : null;
  }

  async deleteRosterEntry(id: string): Promise<boolean> {
    const query = `DELETE FROM hrms.roster_entries WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===== SHIFT SWAP =====
  async findSwapRequestById(id: string): Promise<ShiftSwapRequest | null> {
    const query = `SELECT * FROM hrms.shift_swap_requests WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.mapSwapRequestToEntity(result.rows[0]) : null;
  }

  async findPendingSwapRequests(tenantId: string): Promise<ShiftSwapRequest[]> {
    const query = `
      SELECT ssr.*, 
        CONCAT(e1.first_name, ' ', e1.last_name) as requester_name,
        CONCAT(e2.first_name, ' ', e2.last_name) as target_name
      FROM hrms.shift_swap_requests ssr
      JOIN hrms.employees e1 ON ssr.requester_id = e1.id
      JOIN hrms.employees e2 ON ssr.target_employee_id = e2.id
      WHERE ssr.tenant_id = $1 AND ssr.status = 'PENDING'
      ORDER BY ssr.created_at DESC
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows.map(row => this.mapSwapRequestToEntity(row));
  }

  async findSwapRequestsByEmployee(employeeId: string): Promise<ShiftSwapRequest[]> {
    const query = `
      SELECT * FROM hrms.shift_swap_requests
      WHERE requester_id = $1 OR target_employee_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(row => this.mapSwapRequestToEntity(row));
  }

  async createSwapRequest(request: Omit<ShiftSwapRequest, 'id'>): Promise<ShiftSwapRequest> {
    const query = `
      INSERT INTO hrms.shift_swap_requests (
        tenant_id, requester_id, requester_roster_entry_id,
        target_employee_id, target_roster_entry_id, reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      request.tenantId,
      request.requesterId,
      request.requesterRosterEntryId,
      request.targetEmployeeId,
      request.targetRosterEntryId,
      request.reason,
      request.status,
    ]);

    return this.mapSwapRequestToEntity(result.rows[0]);
  }

  async approveSwapRequest(id: string, approverId: string): Promise<ShiftSwapRequest | null> {
    const query = `
      UPDATE hrms.shift_swap_requests
      SET status = 'APPROVED', approved_by = $2, approved_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'PENDING'
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, approverId]);
    
    if (result.rows.length > 0) {
      // Actually swap the roster entries
      const swap = this.mapSwapRequestToEntity(result.rows[0]);
      await this.performSwap(swap);
    }
    
    return result.rows.length > 0 ? this.findSwapRequestById(id) : null;
  }

  async rejectSwapRequest(id: string, reason: string): Promise<ShiftSwapRequest | null> {
    const query = `
      UPDATE hrms.shift_swap_requests
      SET status = 'REJECTED', rejection_reason = $2, updated_at = NOW()
      WHERE id = $1 AND status = 'PENDING'
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, reason]);
    return result.rows.length > 0 ? this.findSwapRequestById(id) : null;
  }

  private async performSwap(swap: ShiftSwapRequest): Promise<void> {
    // Get both roster entries
    const entry1Query = `SELECT * FROM hrms.roster_entries WHERE id = $1`;
    const entry2Query = `SELECT * FROM hrms.roster_entries WHERE id = $1`;
    
    const [result1, result2] = await Promise.all([
      this.pool.query(entry1Query, [swap.requesterRosterEntryId]),
      this.pool.query(entry2Query, [swap.targetRosterEntryId]),
    ]);

    if (result1.rows.length === 0 || result2.rows.length === 0) return;

    const entry1 = result1.rows[0];
    const entry2 = result2.rows[0];

    // Swap employee_ids
    await Promise.all([
      this.pool.query(
        `UPDATE hrms.roster_entries SET employee_id = $1, swapped_with = $2, status = 'SWAPPED' WHERE id = $3`,
        [entry2.employee_id, entry2.id, entry1.id]
      ),
      this.pool.query(
        `UPDATE hrms.roster_entries SET employee_id = $1, swapped_with = $2, status = 'SWAPPED' WHERE id = $3`,
        [entry1.employee_id, entry1.id, entry2.id]
      ),
    ]);
  }

  async generateRosterFromPattern(
    tenantId: string,
    patternId: string,
    employeeIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<RosterEntry[]> {
    const pattern = await this.findWorkPatternById(patternId);
    if (!pattern) return [];

    const entries: Omit<RosterEntry, 'id'>[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.toLocaleDateString('en-US', { weekday: 'uppercase' }) as WeeklyPattern['dayOfWeek'];
      const dayPattern = pattern.pattern.find(p => p.dayOfWeek === dayOfWeek);

      if (dayPattern && dayPattern.isWorkingDay && dayPattern.shiftId) {
        for (const employeeId of employeeIds) {
          entries.push({
            tenantId,
            employeeId,
            date: new Date(current),
            shiftId: dayPattern.shiftId,
            status: 'SCHEDULED',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return this.createRosterEntriesBulk(entries);
  }

  // ===== MAPPERS =====
  private mapShiftToEntity(row: Record<string, unknown>): Shift {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      name: row.name as string,
      code: row.code as string,
      type: row.type as Shift['type'],
      startTime: row.start_time as string,
      endTime: row.end_time as string,
      breakDuration: row.break_duration as number,
      workHours: parseFloat(row.work_hours as string),
      isOvernight: row.is_overnight as boolean,
      color: row.color as string,
      isActive: row.is_active as boolean,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapWorkPatternToEntity(row: Record<string, unknown>): WorkPattern {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      pattern: typeof row.pattern === 'string' ? JSON.parse(row.pattern) : row.pattern,
      isRotating: row.is_rotating as boolean,
      rotationWeeks: row.rotation_weeks as number,
      isDefault: row.is_default as boolean,
      isActive: row.is_active as boolean,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapRosterToEntity(row: Record<string, unknown>, entryRows: Record<string, unknown>[]): Roster {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      startDate: new Date(row.start_date as string),
      endDate: new Date(row.end_date as string),
      branchId: row.branch_id as string | undefined,
      departmentId: row.department_id as string | undefined,
      status: row.status as Roster['status'],
      entries: entryRows.map(e => this.mapRosterEntryToEntity(e)),
      publishedAt: row.published_at ? new Date(row.published_at as string) : undefined,
      publishedBy: row.published_by as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string,
    };
  }

  private mapRosterEntryToEntity(row: Record<string, unknown>): RosterEntry {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      employeeId: row.employee_id as string,
      employeeName: row.employee_name as string | undefined,
      date: new Date(row.date as string),
      shiftId: row.shift_id as string,
      shiftName: row.shift_name as string | undefined,
      actualStartTime: row.actual_start_time as string | undefined,
      actualEndTime: row.actual_end_time as string | undefined,
      status: row.status as RosterEntry['status'],
      swappedWith: row.swapped_with as string | undefined,
      swapApprovedBy: row.swap_approved_by as string | undefined,
      notes: row.notes as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapSwapRequestToEntity(row: Record<string, unknown>): ShiftSwapRequest {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      requesterId: row.requester_id as string,
      requesterName: row.requester_name as string | undefined,
      requesterRosterEntryId: row.requester_roster_entry_id as string,
      targetEmployeeId: row.target_employee_id as string,
      targetName: row.target_name as string | undefined,
      targetRosterEntryId: row.target_roster_entry_id as string,
      reason: row.reason as string,
      status: row.status as ShiftSwapRequest['status'],
      approvedBy: row.approved_by as string | undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
      rejectionReason: row.rejection_reason as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
