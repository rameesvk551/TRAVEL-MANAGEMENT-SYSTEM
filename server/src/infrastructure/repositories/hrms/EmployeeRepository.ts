// infrastructure/repositories/hrms/EmployeeRepository.ts
// PostgreSQL implementation of Employee repository

import { Pool, PoolClient } from 'pg';
import {
  Employee,
  EmployeeType,
  EmployeeCategory,
  LifecycleStage,
} from '../../../domain/entities/hrms/Employee';
import {
  IEmployeeRepository,
  EmployeeFilters,
  EmployeePagination,
  PaginatedResult,
} from '../../../domain/interfaces/hrms/IEmployeeRepository';

export class EmployeeRepository implements IEmployeeRepository {
  constructor(private pool: Pool) {}

  async findById(id: string, tenantId: string): Promise<Employee | null> {
    const query = `
      SELECT * FROM hrms.employees 
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByCode(code: string, tenantId: string): Promise<Employee | null> {
    const query = `
      SELECT * FROM hrms.employees 
      WHERE employee_code = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [code, tenantId]);
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<Employee | null> {
    const query = `
      SELECT * FROM hrms.employees 
      WHERE contact->>'email' = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [email, tenantId]);
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findAll(
    tenantId: string,
    filters: EmployeeFilters,
    pagination: EmployeePagination
  ): Promise<PaginatedResult<Employee>> {
    const conditions: string[] = ['tenant_id = $1', 'deleted_at IS NULL'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(filters.type);
    }
    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }
    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      params.push(filters.branchId);
    }
    if (filters.departmentId) {
      conditions.push(`department_id = $${paramIndex++}`);
      params.push(filters.departmentId);
    }
    if (filters.lifecycleStage) {
      conditions.push(`lifecycle_stage = $${paramIndex++}`);
      params.push(filters.lifecycleStage);
    }
    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      params.push(filters.isActive);
    }
    if (filters.search) {
      conditions.push(`(
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        employee_code ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const orderBy = `${pagination.sortBy || 'created_at'} ${pagination.sortOrder || 'DESC'}`;
    const offset = ((pagination.page || 1) - 1) * (pagination.limit || 20);

    const countQuery = `SELECT COUNT(*) FROM hrms.employees WHERE ${whereClause}`;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT * FROM hrms.employees 
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    params.push(pagination.limit || 20, offset);

    const dataResult = await this.pool.query(dataQuery, params);

    return {
      data: dataResult.rows.map(row => this.toDomain(row)),
      total,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      totalPages: Math.ceil(total / (pagination.limit || 20)),
    };
  }

  async findByReportingTo(managerId: string, tenantId: string): Promise<Employee[]> {
    const query = `
      SELECT * FROM hrms.employees 
      WHERE reporting_to = $1 AND tenant_id = $2 AND deleted_at IS NULL
      ORDER BY first_name, last_name
    `;
    const result = await this.pool.query(query, [managerId, tenantId]);
    return result.rows.map(row => this.toDomain(row));
  }

  async findAvailable(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    skills?: string[]
  ): Promise<Employee[]> {
    // Find employees not assigned to trips or on leave during the period
    let query = `
      SELECT e.* FROM hrms.employees e
      WHERE e.tenant_id = $1 
        AND e.is_active = true 
        AND e.deleted_at IS NULL
        AND e.category IN ('FIELD_STAFF', 'SEASONAL', 'CONTRACT')
        AND NOT EXISTS (
          SELECT 1 FROM hrms.trip_assignments ta
          WHERE ta.employee_id = e.id
            AND ta.status NOT IN ('CANCELLED', 'DECLINED')
            AND ta.start_date <= $3 AND ta.end_date >= $2
        )
        AND NOT EXISTS (
          SELECT 1 FROM hrms.leave_requests lr
          WHERE lr.employee_id = e.id
            AND lr.status = 'APPROVED'
            AND lr.from_date <= $3 AND lr.to_date >= $2
        )
    `;

    const params: any[] = [tenantId, startDate, endDate];

    if (skills && skills.length > 0) {
      query += `
        AND EXISTS (
          SELECT 1 FROM hrms.employee_skills es
          WHERE es.employee_id = e.id AND es.skill_id = ANY($4)
        )
      `;
      params.push(skills);
    }

    query += ' ORDER BY e.first_name, e.last_name';

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.toDomain(row));
  }

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const query = `
      INSERT INTO hrms.employees (
        tenant_id, employee_code, first_name, last_name, preferred_name,
        type, category, branch_id, department_id, reporting_to, cost_center_id,
        joining_date, probation_end_date, confirmation_date,
        lifecycle_stage, is_active, contact, emergency_contacts, attributes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      employee.tenantId,
      employee.employeeCode,
      employee.firstName,
      employee.lastName,
      employee.preferredName,
      employee.type,
      employee.category,
      employee.branchId,
      employee.departmentId,
      employee.reportingTo,
      employee.costCenterId,
      employee.joiningDate,
      employee.probationEndDate,
      employee.confirmationDate,
      employee.lifecycleStage,
      employee.isActive,
      JSON.stringify(employee.contact),
      JSON.stringify(employee.emergencyContacts),
      JSON.stringify(employee.attributes),
      employee.createdBy,
    ]);

    return this.toDomain(result.rows[0]);
  }

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      preferredName: 'preferred_name',
      type: 'type',
      category: 'category',
      branchId: 'branch_id',
      departmentId: 'department_id',
      reportingTo: 'reporting_to',
      costCenterId: 'cost_center_id',
      joiningDate: 'joining_date',
      probationEndDate: 'probation_end_date',
      confirmationDate: 'confirmation_date',
      lifecycleStage: 'lifecycle_stage',
      isActive: 'is_active',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key as keyof Employee] !== undefined) {
        setClauses.push(`${column} = $${paramIndex++}`);
        params.push(data[key as keyof Employee]);
      }
    }

    if (data.contact) {
      setClauses.push(`contact = $${paramIndex++}`);
      params.push(JSON.stringify(data.contact));
    }
    if (data.emergencyContacts) {
      setClauses.push(`emergency_contacts = $${paramIndex++}`);
      params.push(JSON.stringify(data.emergencyContacts));
    }
    if (data.attributes) {
      setClauses.push(`attributes = $${paramIndex++}`);
      params.push(JSON.stringify(data.attributes));
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.employees 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return this.toDomain(result.rows[0]);
  }

  async softDelete(id: string): Promise<void> {
    const query = `UPDATE hrms.employees SET deleted_at = NOW() WHERE id = $1`;
    await this.pool.query(query, [id]);
  }

  async generateEmployeeCode(tenantId: string): Promise<string> {
    const query = `
      SELECT MAX(CAST(SUBSTRING(employee_code FROM 4) AS INTEGER)) as max_num
      FROM hrms.employees
      WHERE tenant_id = $1 AND employee_code ~ '^EMP[0-9]+$'
    `;
    const result = await this.pool.query(query, [tenantId]);
    const maxNum = result.rows[0]?.max_num || 0;
    return `EMP${String(maxNum + 1).padStart(5, '0')}`;
  }

  // Additional required methods
  async delete(id: string, tenantId: string): Promise<void> {
    const query = `
      UPDATE hrms.employees 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;
    await this.pool.query(query, [id, tenantId]);
  }

  async findByBranch(branchId: string, tenantId: string): Promise<Employee[]> {
    const query = `
      SELECT * FROM hrms.employees 
      WHERE branch_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [branchId, tenantId]);
    return result.rows.map((row) => this.toDomain(row));
  }

  async findByDepartment(departmentId: string, tenantId: string): Promise<Employee[]> {
    const query = `
      SELECT * FROM hrms.employees 
      WHERE department_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [departmentId, tenantId]);
    return result.rows.map((row) => this.toDomain(row));
  }

  async countByTenant(tenantId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM hrms.employees 
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [tenantId]);
    return parseInt(result.rows[0].count, 10);
  }

  async countByLifecycleStage(tenantId: string): Promise<Record<LifecycleStage, number>> {
    const query = `
      SELECT lifecycle_stage, COUNT(*) as count FROM hrms.employees 
      WHERE tenant_id = $1 AND deleted_at IS NULL
      GROUP BY lifecycle_stage
    `;
    const result = await this.pool.query(query, [tenantId]);
    const counts: Record<LifecycleStage, number> = {
      PRE_HIRE: 0, ONBOARDING: 0, ACTIVE: 0, ON_LEAVE: 0,
      NOTICE: 0, RESIGNED: 0, TERMINATED: 0, ARCHIVED: 0
    };
    for (const row of result.rows) {
      counts[row.lifecycle_stage as LifecycleStage] = parseInt(row.count, 10) || 0;
    }
    return counts;
  }

  private toDomain(row: any): Employee {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      employeeCode: row.employee_code,
      firstName: row.first_name,
      lastName: row.last_name,
      preferredName: row.preferred_name,
      type: row.type as EmployeeType,
      category: row.category as EmployeeCategory,
      branchId: row.branch_id,
      departmentId: row.department_id,
      reportingTo: row.reporting_to,
      costCenterId: row.cost_center_id,
      joiningDate: new Date(row.joining_date),
      probationEndDate: row.probation_end_date ? new Date(row.probation_end_date) : undefined,
      confirmationDate: row.confirmation_date ? new Date(row.confirmation_date) : undefined,
      lifecycleStage: row.lifecycle_stage as LifecycleStage,
      isActive: row.is_active,
      contact: typeof row.contact === 'string' ? JSON.parse(row.contact) : row.contact,
      emergencyContacts: typeof row.emergency_contacts === 'string' 
        ? JSON.parse(row.emergency_contacts) 
        : row.emergency_contacts || [],
      attributes: typeof row.attributes === 'string' 
        ? JSON.parse(row.attributes) 
        : row.attributes || {},
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
