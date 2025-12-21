// infrastructure/repositories/hrms/LeaveRepository.ts
// PostgreSQL implementation of Leave repository

import { Pool } from 'pg';
import {
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  LeaveStatus,
} from '../../../domain/entities/hrms/Leave';
import {
  ILeaveRepository,
  LeaveRequestFilters,
} from '../../../domain/interfaces/hrms/ILeaveRepository';

export class LeaveRepository implements ILeaveRepository {
  constructor(private pool: Pool) {}

  // Leave Type Methods
  async findTypeById(id: string, tenantId: string): Promise<LeaveType | null> {
    const query = `
      SELECT * FROM hrms.leave_types 
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] ? this.toLeaveTypeDomain(result.rows[0]) : null;
  }

  async findAllTypes(tenantId: string): Promise<LeaveType[]> {
    const query = `
      SELECT * FROM hrms.leave_types 
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY name
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows.map(row => this.toLeaveTypeDomain(row));
  }

  async findTypeByCode(code: string, tenantId: string): Promise<LeaveType | null> {
    const query = `
      SELECT * FROM hrms.leave_types 
      WHERE code = $1 AND tenant_id = $2
    `;
    const result = await this.pool.query(query, [code, tenantId]);
    return result.rows[0] ? this.toLeaveTypeDomain(result.rows[0]) : null;
  }

  async createType(leaveType: Omit<LeaveType, 'id'>): Promise<LeaveType> {
    const query = `
      INSERT INTO hrms.leave_types (
        tenant_id, code, name, description, is_paid, max_days_per_year,
        max_consecutive_days, min_days_notice, carry_forward_limit,
        requires_document, requires_approval, accrual_type, accrual_amount,
        applicable_to, blackout_periods, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      leaveType.tenantId,
      leaveType.code,
      leaveType.name,
      leaveType.description,
      leaveType.isPaid,
      leaveType.maxDaysPerYear,
      leaveType.maxConsecutiveDays,
      leaveType.minDaysNotice,
      leaveType.carryForwardLimit,
      leaveType.requiresDocument,
      leaveType.requiresApproval,
      leaveType.accrualType,
      leaveType.accrualAmount,
      JSON.stringify(leaveType.applicableTo),
      JSON.stringify(leaveType.blackoutPeriods),
      leaveType.isActive,
    ]);
    return this.toLeaveTypeDomain(result.rows[0]);
  }

  async updateType(id: string, data: Partial<LeaveType>): Promise<LeaveType> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields: (keyof LeaveType)[] = [
      'name', 'description', 'isPaid', 'maxDaysPerYear', 'maxConsecutiveDays',
      'minDaysNotice', 'carryForwardLimit', 'requiresDocument', 'requiresApproval', 'isActive'
    ];
    const columnMap: Record<string, string> = {
      name: 'name', description: 'description', isPaid: 'is_paid',
      maxDaysPerYear: 'max_days_per_year', maxConsecutiveDays: 'max_consecutive_days',
      minDaysNotice: 'min_days_notice', carryForwardLimit: 'carry_forward_limit',
      requiresDocument: 'requires_document', requiresApproval: 'requires_approval', isActive: 'is_active'
    };

    for (const field of fields) {
      if (data[field] !== undefined) {
        setClauses.push(`${columnMap[field]} = $${paramIndex++}`);
        params.push(data[field]);
      }
    }
    if (data.applicableTo) {
      setClauses.push(`applicable_to = $${paramIndex++}`);
      params.push(JSON.stringify(data.applicableTo));
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.leave_types SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} RETURNING *
    `;
    const result = await this.pool.query(query, params);
    return this.toLeaveTypeDomain(result.rows[0]);
  }

  // Leave Request Methods
  async findRequestById(id: string, tenantId: string): Promise<LeaveRequest | null> {
    const query = `
      SELECT * FROM hrms.leave_requests 
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] ? this.toRequestDomain(result.rows[0]) : null;
  }

  async findAllRequests(
    tenantId: string,
    filters: LeaveRequestFilters
  ): Promise<LeaveRequest[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.employeeId) {
      conditions.push(`employee_id = $${paramIndex++}`);
      params.push(filters.employeeId);
    }
    if (filters.leaveTypeId) {
      conditions.push(`leave_type_id = $${paramIndex++}`);
      params.push(filters.leaveTypeId);
    }
    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters.dateFrom) {
      conditions.push(`from_date >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push(`to_date <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }

    const query = `
      SELECT * FROM hrms.leave_requests 
      WHERE ${conditions.join(' AND ')}
      ORDER BY from_date DESC
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.toRequestDomain(row));
  }

  async findPendingForApprover(
    approverId: string,
    tenantId: string
  ): Promise<LeaveRequest[]> {
    const query = `
      SELECT lr.* FROM hrms.leave_requests lr
      WHERE lr.tenant_id = $1 
        AND lr.status = 'PENDING'
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(lr.approval_chain) AS ac
          WHERE ac->>'approverId' = $2 
            AND ac->>'status' = 'PENDING'
            AND (ac->>'order')::int = lr.current_approver_index
        )
      ORDER BY lr.from_date
    `;
    const result = await this.pool.query(query, [tenantId, approverId]);
    return result.rows.map(row => this.toRequestDomain(row));
  }

  async findOverlapping(
    employeeId: string,
    fromDate: Date,
    toDate: Date,
    tenantId: string,
    excludeRequestId?: string
  ): Promise<LeaveRequest[]> {
    let query = `
      SELECT * FROM hrms.leave_requests 
      WHERE employee_id = $1 
        AND tenant_id = $2
        AND status NOT IN ('CANCELLED', 'REJECTED')
        AND from_date <= $4 AND to_date >= $3
    `;
    const params: any[] = [employeeId, tenantId, fromDate, toDate];

    if (excludeRequestId) {
      query += ` AND id != $5`;
      params.push(excludeRequestId);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.toRequestDomain(row));
  }

  async createRequest(
    request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<LeaveRequest> {
    const query = `
      INSERT INTO hrms.leave_requests (
        tenant_id, employee_id, leave_type_id, from_date, to_date,
        total_days, is_half_day, half_day_type, reason, status,
        approval_chain, current_approver_index, has_conflict,
        conflicting_trips, replacement_employee_id, replacement_confirmed,
        attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      request.tenantId,
      request.employeeId,
      request.leaveTypeId,
      request.fromDate,
      request.toDate,
      request.totalDays,
      request.isHalfDay,
      request.halfDayType,
      request.reason,
      request.status,
      JSON.stringify(request.approvalChain),
      request.currentApproverIndex,
      request.hasConflict,
      JSON.stringify(request.conflictingTrips),
      request.replacementEmployeeId,
      request.replacementConfirmed,
      JSON.stringify(request.attachments),
    ]);

    return this.toRequestDomain(result.rows[0]);
  }

  async updateRequest(
    id: string,
    data: Partial<LeaveRequest>
  ): Promise<LeaveRequest> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.approvalChain !== undefined) {
      setClauses.push(`approval_chain = $${paramIndex++}`);
      params.push(JSON.stringify(data.approvalChain));
    }
    if (data.currentApproverIndex !== undefined) {
      setClauses.push(`current_approver_index = $${paramIndex++}`);
      params.push(data.currentApproverIndex);
    }
    if (data.cancelledAt !== undefined) {
      setClauses.push(`cancelled_at = $${paramIndex++}`);
      params.push(data.cancelledAt);
    }
    if (data.cancellationReason !== undefined) {
      setClauses.push(`cancellation_reason = $${paramIndex++}`);
      params.push(data.cancellationReason);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.leave_requests 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return this.toRequestDomain(result.rows[0]);
  }

  async deleteRequest(id: string, tenantId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM hrms.leave_requests WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }

  // Leave Balance Methods
  async findBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    tenantId: string
  ): Promise<LeaveBalance | null> {
    const query = `
      SELECT * FROM hrms.leave_balances 
      WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3 AND tenant_id = $4
    `;
    const result = await this.pool.query(query, [employeeId, leaveTypeId, year, tenantId]);
    return result.rows[0] ? this.toBalanceDomain(result.rows[0]) : null;
  }

  async findAllBalances(
    employeeId: string,
    year: number,
    tenantId: string
  ): Promise<LeaveBalance[]> {
    const query = `
      SELECT * FROM hrms.leave_balances 
      WHERE employee_id = $1 AND year = $2 AND tenant_id = $3
    `;
    const result = await this.pool.query(query, [employeeId, year, tenantId]);
    return result.rows.map(row => this.toBalanceDomain(row));
  }

  async updateBalance(id: string, data: Partial<LeaveBalance>): Promise<LeaveBalance> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.taken !== undefined) {
      setClauses.push(`taken = $${paramIndex++}`);
      params.push(data.taken);
    }
    if (data.pending !== undefined) {
      setClauses.push(`pending = $${paramIndex++}`);
      params.push(data.pending);
    }
    if (data.adjusted !== undefined) {
      setClauses.push(`adjusted = $${paramIndex++}`);
      params.push(data.adjusted);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.leave_balances 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return this.toBalanceDomain(result.rows[0]);
  }

  async createBalance(
    balance: Omit<LeaveBalance, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<LeaveBalance> {
    const query = `
      INSERT INTO hrms.leave_balances (
        tenant_id, employee_id, leave_type_id, year,
        opening, accrued, taken, pending, adjusted, carry_forward
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      balance.tenantId,
      balance.employeeId,
      balance.leaveTypeId,
      balance.year,
      balance.opening,
      balance.accrued,
      balance.taken,
      balance.pending,
      balance.adjusted,
      balance.carryForward,
    ]);

    return this.toBalanceDomain(result.rows[0]);
  }

  async initializeBalances(
    employeeId: string,
    year: number,
    tenantId: string
  ): Promise<LeaveBalance[]> {
    // Get all active leave types for tenant
    const leaveTypes = await this.findAllTypes(tenantId);
    const balances: LeaveBalance[] = [];

    for (const leaveType of leaveTypes) {
      // Check if balance already exists
      const existing = await this.findBalance(employeeId, leaveType.id, year, tenantId);
      if (!existing) {
        const balance = await this.createBalance({
          tenantId,
          employeeId,
          leaveTypeId: leaveType.id,
          year,
          opening: leaveType.maxDaysPerYear || 0,
          accrued: 0,
          taken: 0,
          pending: 0,
          adjusted: 0,
          carryForward: 0,
        });
        balances.push(balance);
      } else {
        balances.push(existing);
      }
    }

    return balances;
  }

  // Domain Mappers
  private toLeaveTypeDomain(row: any): LeaveType {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      name: row.name,
      description: row.description,
      isPaid: row.is_paid,
      maxDaysPerYear: row.max_days_per_year,
      carryForwardLimit: row.carry_forward_limit || 0,
      minDaysNotice: row.min_days_notice || 0,
      maxConsecutiveDays: row.max_consecutive_days,
      applicableTo: row.applicable_to || [],
      requiresApproval: row.requires_approval ?? true,
      requiresDocument: row.requires_document ?? false,
      accrualType: row.accrual_type || 'ANNUAL',
      accrualAmount: row.accrual_amount,
      blackoutPeriods: row.blackout_periods || [],
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toRequestDomain(row: any): LeaveRequest {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      employeeId: row.employee_id,
      leaveTypeId: row.leave_type_id,
      fromDate: new Date(row.from_date),
      toDate: new Date(row.to_date),
      totalDays: parseFloat(row.total_days),
      isHalfDay: row.is_half_day,
      halfDayType: row.half_day_type,
      reason: row.reason,
      status: row.status as LeaveStatus,
      approvalChain: typeof row.approval_chain === 'string'
        ? JSON.parse(row.approval_chain)
        : row.approval_chain || [],
      currentApproverIndex: row.current_approver_index || 0,
      hasConflict: row.has_conflict,
      conflictingTrips: typeof row.conflicting_trips === 'string'
        ? JSON.parse(row.conflicting_trips)
        : row.conflicting_trips || [],
      replacementEmployeeId: row.replacement_employee_id,
      replacementConfirmed: row.replacement_confirmed,
      attachments: typeof row.attachments === 'string'
        ? JSON.parse(row.attachments)
        : row.attachments || [],
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
      cancellationReason: row.cancellation_reason,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toBalanceDomain(row: any): LeaveBalance {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      employeeId: row.employee_id,
      leaveTypeId: row.leave_type_id,
      year: row.year,
      opening: parseFloat(row.opening) || 0,
      accrued: parseFloat(row.accrued) || 0,
      taken: parseFloat(row.taken) || 0,
      pending: parseFloat(row.pending) || 0,
      adjusted: parseFloat(row.adjusted) || 0,
      carryForward: parseFloat(row.carry_forward) || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
