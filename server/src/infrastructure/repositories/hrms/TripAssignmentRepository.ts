// infrastructure/repositories/hrms/TripAssignmentRepository.ts
// PostgreSQL implementation of Trip Assignment repository

import { Pool } from 'pg';
import {
  TripAssignment,
  TripRole,
  AssignmentStatus,
  CompensationType,
} from '../../../domain/entities/hrms/TripAssignment';
import {
  ITripAssignmentRepository,
  TripAssignmentFilters,
  StaffAvailability,
} from '../../../domain/interfaces/hrms/ITripAssignmentRepository';

export class TripAssignmentRepository implements ITripAssignmentRepository {
  constructor(private pool: Pool) {}

  async findById(id: string, tenantId: string): Promise<TripAssignment | null> {
    const query = `
      SELECT ta.*, t.name as trip_name, 
             e.first_name || ' ' || e.last_name as employee_name
      FROM hrms.trip_assignments ta
      LEFT JOIN inventory.trips t ON ta.trip_id = t.id
      LEFT JOIN hrms.employees e ON ta.employee_id = e.id
      WHERE ta.id = $1 AND ta.tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findAll(
    tenantId: string,
    filters: TripAssignmentFilters
  ): Promise<TripAssignment[]> {
    const conditions: string[] = ['ta.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.tripId) {
      conditions.push(`ta.trip_id = $${paramIndex++}`);
      params.push(filters.tripId);
    }
    if (filters.employeeId) {
      conditions.push(`ta.employee_id = $${paramIndex++}`);
      params.push(filters.employeeId);
    }
    if (filters.role) {
      conditions.push(`ta.role = $${paramIndex++}`);
      params.push(filters.role);
    }
    if (filters.status) {
      conditions.push(`ta.status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters.dateFrom) {
      conditions.push(`ta.start_date >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push(`ta.end_date <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }
    if (filters.isPrimary !== undefined) {
      conditions.push(`ta.is_primary = $${paramIndex++}`);
      params.push(filters.isPrimary);
    }

    const query = `
      SELECT ta.*, t.name as trip_name,
             e.first_name || ' ' || e.last_name as employee_name
      FROM hrms.trip_assignments ta
      LEFT JOIN inventory.trips t ON ta.trip_id = t.id
      LEFT JOIN hrms.employees e ON ta.employee_id = e.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ta.start_date DESC
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.toDomain(row));
  }

  async findByTrip(tripId: string, tenantId: string): Promise<TripAssignment[]> {
    const query = `
      SELECT ta.*, t.name as trip_name,
             e.first_name || ' ' || e.last_name as employee_name
      FROM hrms.trip_assignments ta
      LEFT JOIN inventory.trips t ON ta.trip_id = t.id
      LEFT JOIN hrms.employees e ON ta.employee_id = e.id
      WHERE ta.trip_id = $1 AND ta.tenant_id = $2
      ORDER BY ta.is_primary DESC, ta.role, e.first_name
    `;
    const result = await this.pool.query(query, [tripId, tenantId]);
    return result.rows.map(row => this.toDomain(row));
  }

  async findByEmployee(
    employeeId: string,
    tenantId: string,
    filters?: TripAssignmentFilters
  ): Promise<TripAssignment[]> {
    const conditions: string[] = ['ta.employee_id = $1', 'ta.tenant_id = $2'];
    const params: any[] = [employeeId, tenantId];
    let paramIndex = 3;

    if (filters?.status) {
      conditions.push(`ta.status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters?.dateFrom) {
      conditions.push(`ta.start_date >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }
    if (filters?.dateTo) {
      conditions.push(`ta.end_date <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }

    const query = `
      SELECT ta.*, t.name as trip_name,
             e.first_name || ' ' || e.last_name as employee_name
      FROM hrms.trip_assignments ta
      LEFT JOIN inventory.trips t ON ta.trip_id = t.id
      LEFT JOIN hrms.employees e ON ta.employee_id = e.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ta.start_date DESC
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.toDomain(row));
  }

  async findUpcoming(
    employeeId: string,
    tenantId: string,
    limit: number
  ): Promise<TripAssignment[]> {
    const query = `
      SELECT ta.*, t.name as trip_name,
             e.first_name || ' ' || e.last_name as employee_name
      FROM hrms.trip_assignments ta
      LEFT JOIN inventory.trips t ON ta.trip_id = t.id
      LEFT JOIN hrms.employees e ON ta.employee_id = e.id
      WHERE ta.employee_id = $1 
        AND ta.tenant_id = $2
        AND ta.start_date >= CURRENT_DATE
        AND ta.status NOT IN ('CANCELLED', 'DECLINED')
      ORDER BY ta.start_date
      LIMIT $3
    `;
    const result = await this.pool.query(query, [employeeId, tenantId, limit]);
    return result.rows.map(row => this.toDomain(row));
  }

  async findConflicts(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
    excludeAssignmentId?: string
  ): Promise<TripAssignment[]> {
    let query = `
      SELECT ta.*, t.name as trip_name
      FROM hrms.trip_assignments ta
      LEFT JOIN inventory.trips t ON ta.trip_id = t.id
      WHERE ta.employee_id = $1 
        AND ta.tenant_id = $2
        AND ta.status NOT IN ('CANCELLED', 'DECLINED')
        AND ta.start_date <= $4 AND ta.end_date >= $3
    `;
    const params: any[] = [employeeId, tenantId, startDate, endDate];

    if (excludeAssignmentId) {
      query += ` AND ta.id != $5`;
      params.push(excludeAssignmentId);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.toDomain(row));
  }

  async checkAvailability(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<boolean> {
    const conflicts = await this.findConflicts(employeeId, startDate, endDate, tenantId);
    return conflicts.length === 0;
  }

  async getStaffAvailability(
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<StaffAvailability[]> {
    const query = `
      SELECT 
        e.id as employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        e.category,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as skills,
        NOT EXISTS (
          SELECT 1 FROM hrms.trip_assignments ta
          WHERE ta.employee_id = e.id
            AND ta.status NOT IN ('CANCELLED', 'DECLINED')
            AND ta.start_date <= $3 AND ta.end_date >= $2
        ) AND NOT EXISTS (
          SELECT 1 FROM hrms.leave_requests lr
          WHERE lr.employee_id = e.id
            AND lr.status = 'APPROVED'
            AND lr.from_date <= $3 AND lr.to_date >= $2
        ) as is_available,
        (
          SELECT COUNT(*) FROM hrms.trip_assignments ta
          WHERE ta.employee_id = e.id
            AND ta.status = 'COMPLETED'
            AND ta.end_date >= CURRENT_DATE - INTERVAL '30 days'
        ) as recent_trip_count
      FROM hrms.employees e
      LEFT JOIN hrms.employee_skills es ON e.id = es.employee_id
      LEFT JOIN hrms.skills s ON es.skill_id = s.id
      WHERE e.tenant_id = $1
        AND e.is_active = true
        AND e.category IN ('FIELD_STAFF', 'SEASONAL', 'CONTRACT')
      GROUP BY e.id, e.first_name, e.last_name, e.category
      ORDER BY e.first_name, e.last_name
    `;

    const result = await this.pool.query(query, [tenantId, startDate, endDate]);
    
    // For each employee, get conflicting trips if not available
    const staffAvailability: StaffAvailability[] = [];
    
    for (const row of result.rows) {
      let conflictingTrips: StaffAvailability['conflictingTrips'] = [];
      
      if (!row.is_available) {
        // Get conflicting trip assignments
        const conflictsQuery = `
          SELECT ta.trip_id, t.name as trip_name, ta.start_date, ta.end_date
          FROM hrms.trip_assignments ta
          LEFT JOIN inventory.trips t ON ta.trip_id = t.id
          WHERE ta.employee_id = $1
            AND ta.status NOT IN ('CANCELLED', 'DECLINED')
            AND ta.start_date <= $3 AND ta.end_date >= $2
        `;
        const conflictsResult = await this.pool.query(conflictsQuery, [
          row.employee_id, startDate, endDate
        ]);
        conflictingTrips = conflictsResult.rows.map(c => ({
          tripId: c.trip_id,
          tripName: c.trip_name || 'Unknown Trip',
          startDate: new Date(c.start_date),
          endDate: new Date(c.end_date),
        }));
      }

      staffAvailability.push({
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        category: row.category,
        skills: row.skills || [],
        isAvailable: row.is_available,
        conflictingTrips,
      });
    }

    return staffAvailability;
  }

  async create(
    assignment: Omit<TripAssignment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TripAssignment> {
    const query = `
      INSERT INTO hrms.trip_assignments (
        tenant_id, trip_id, employee_id, role, is_primary,
        start_date, end_date, total_days, status,
        compensation_type, trip_bonus, daily_rate, total_compensation,
        special_instructions, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      assignment.tenantId,
      assignment.tripId,
      assignment.employeeId,
      assignment.role,
      assignment.isPrimary,
      assignment.startDate,
      assignment.endDate,
      assignment.totalDays,
      assignment.status,
      assignment.compensationType,
      assignment.tripBonus || 0,
      assignment.dailyRate || 0,
      assignment.totalCompensation || 0,
      assignment.specialInstructions,
      assignment.createdBy,
    ]);

    return this.toDomain(result.rows[0]);
  }

  async update(id: string, data: Partial<TripAssignment>): Promise<TripAssignment> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      confirmedAt: 'confirmed_at',
      declinedAt: 'declined_at',
      declinedReason: 'declined_reason',
      rating: 'rating',
      feedback: 'feedback',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key as keyof TripAssignment] !== undefined) {
        setClauses.push(`${column} = $${paramIndex++}`);
        params.push(data[key as keyof TripAssignment]);
      }
    }

    if (data.incidentReports !== undefined) {
      setClauses.push(`incident_reports = $${paramIndex++}`);
      params.push(JSON.stringify(data.incidentReports));
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.trip_assignments 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return this.toDomain(result.rows[0]);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM hrms.trip_assignments WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }

  async countByEmployee(
    employeeId: string,
    tenantId: string,
    year: number
  ): Promise<{ total: number; completed: number; cancelled: number }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
      FROM hrms.trip_assignments
      WHERE employee_id = $1 
        AND tenant_id = $2
        AND EXTRACT(YEAR FROM start_date) = $3
    `;
    const result = await this.pool.query(query, [employeeId, tenantId, year]);
    const row = result.rows[0];
    return {
      total: parseInt(row.total, 10) || 0,
      completed: parseInt(row.completed, 10) || 0,
      cancelled: parseInt(row.cancelled, 10) || 0,
    };
  }

  async getTripDays(
    employeeId: string,
    tenantId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(total_days), 0) as trip_days
      FROM hrms.trip_assignments
      WHERE employee_id = $1 
        AND tenant_id = $2
        AND status NOT IN ('CANCELLED', 'DECLINED')
        AND start_date <= $4 AND end_date >= $3
    `;
    const result = await this.pool.query(query, [employeeId, tenantId, dateFrom, dateTo]);
    return parseInt(result.rows[0].trip_days, 10) || 0;
  }

  private toDomain(row: any): TripAssignment {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      tripId: row.trip_id,
      tripName: row.trip_name,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      role: row.role as TripRole,
      isPrimary: row.is_primary,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      totalDays: row.total_days,
      status: row.status as AssignmentStatus,
      confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
      declinedAt: row.declined_at ? new Date(row.declined_at) : undefined,
      declinedReason: row.declined_reason,
      compensationType: row.compensation_type as CompensationType,
      tripBonus: parseFloat(row.trip_bonus) || 0,
      dailyRate: parseFloat(row.daily_rate) || 0,
      totalCompensation: parseFloat(row.total_compensation) || 0,
      rating: row.rating,
      feedback: row.feedback,
      incidentReports: typeof row.incident_reports === 'string'
        ? JSON.parse(row.incident_reports)
        : row.incident_reports || [],
      specialInstructions: row.special_instructions,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
