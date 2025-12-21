// infrastructure/repositories/hrms/PayrollRepository.ts
// PostgreSQL implementation of Payroll repository

import { Pool } from 'pg';
import {
  PayStructure,
  Payslip,
  PayPeriod,
  PayslipStatus,
  PayModel,
} from '../../../domain/entities/hrms/Payroll';
import {
  IPayrollRepository,
  PayslipFilters,
  PayrollSummary,
} from '../../../domain/interfaces/hrms/IPayrollRepository';

export class PayrollRepository implements IPayrollRepository {
  constructor(private pool: Pool) {}

  // Pay Structure Methods
  async findStructureById(id: string, tenantId: string): Promise<PayStructure | null> {
    const query = `SELECT * FROM hrms.pay_structures WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] ? this.toStructureDomain(result.rows[0]) : null;
  }

  async findActiveStructure(employeeId: string, tenantId: string): Promise<PayStructure | null> {
    const query = `
      SELECT * FROM hrms.pay_structures 
      WHERE employee_id = $1 AND tenant_id = $2 AND is_active = true
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
      ORDER BY effective_from DESC LIMIT 1
    `;
    const result = await this.pool.query(query, [employeeId, tenantId]);
    return result.rows[0] ? this.toStructureDomain(result.rows[0]) : null;
  }

  async findStructureHistory(employeeId: string, tenantId: string): Promise<PayStructure[]> {
    const query = `
      SELECT * FROM hrms.pay_structures 
      WHERE employee_id = $1 AND tenant_id = $2
      ORDER BY effective_from DESC
    `;
    const result = await this.pool.query(query, [employeeId, tenantId]);
    return result.rows.map(row => this.toStructureDomain(row));
  }

  async createStructure(structure: Omit<PayStructure, 'id'>): Promise<PayStructure> {
    const query = `
      INSERT INTO hrms.pay_structures (
        tenant_id, employee_id, effective_from, effective_to, pay_model,
        base_salary, daily_rate, trip_rate, hourly_rate,
        components, bank_name, account_number, ifsc_code, currency, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      structure.tenantId, structure.employeeId, structure.effectiveFrom,
      structure.effectiveTo, structure.payModel, structure.baseSalary || 0,
      structure.dailyRate || 0, structure.tripRate || 0, structure.hourlyRate || 0,
      JSON.stringify(structure.components), structure.bankName,
      structure.accountNumber, structure.ifscCode, structure.currency, structure.isActive,
    ]);
    return this.toStructureDomain(result.rows[0]);
  }

  async updateStructure(id: string, data: Partial<PayStructure>): Promise<PayStructure> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (data.isActive !== undefined) { setClauses.push(`is_active = $${idx++}`); params.push(data.isActive); }
    if (data.effectiveTo) { setClauses.push(`effective_to = $${idx++}`); params.push(data.effectiveTo); }
    if (data.baseSalary !== undefined) { setClauses.push(`base_salary = $${idx++}`); params.push(data.baseSalary); }
    if (data.components) { setClauses.push(`components = $${idx++}`); params.push(JSON.stringify(data.components)); }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const query = `UPDATE hrms.pay_structures SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, params);
    return this.toStructureDomain(result.rows[0]);
  }

  // Payslip Methods
  async findPayslipById(id: string, tenantId: string): Promise<Payslip | null> {
    const query = `SELECT * FROM hrms.payslips WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] ? this.toPayslipDomain(result.rows[0]) : null;
  }

  async findPayslip(empId: string, year: number, month: number, tenantId: string): Promise<Payslip | null> {
    const query = `SELECT * FROM hrms.payslips WHERE employee_id = $1 AND year = $2 AND month = $3 AND tenant_id = $4`;
    const result = await this.pool.query(query, [empId, year, month, tenantId]);
    return result.rows[0] ? this.toPayslipDomain(result.rows[0]) : null;
  }

  async findAllPayslips(tenantId: string, filters: PayslipFilters): Promise<Payslip[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (filters.employeeId) { conditions.push(`employee_id = $${idx++}`); params.push(filters.employeeId); }
    if (filters.year) { conditions.push(`year = $${idx++}`); params.push(filters.year); }
    if (filters.month) { conditions.push(`month = $${idx++}`); params.push(filters.month); }
    if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }

    const query = `SELECT * FROM hrms.payslips WHERE ${conditions.join(' AND ')} ORDER BY year DESC, month DESC`;
    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.toPayslipDomain(row));
  }

  async createPayslip(payslip: Omit<Payslip, 'id'>): Promise<Payslip> {
    const query = `
      INSERT INTO hrms.payslips (
        tenant_id, employee_id, pay_structure_id, year, month, period_start, period_end,
        present_days, absent_days, leave_days, trip_days, overtime_hours,
        earnings, gross_earnings, deductions, total_deductions,
        trip_earnings, total_trip_earnings, reimbursements, total_reimbursements,
        net_payable, status, generated_at, generated_by, exported_to_accounting
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      payslip.tenantId, payslip.employeeId, payslip.payStructureId,
      payslip.period.year, payslip.period.month, payslip.period.startDate, payslip.period.endDate,
      payslip.presentDays, payslip.absentDays, payslip.leaveDays, payslip.tripDays, payslip.overtimeHours,
      JSON.stringify(payslip.earnings), payslip.grossEarnings,
      JSON.stringify(payslip.deductions), payslip.totalDeductions,
      JSON.stringify(payslip.tripEarnings), payslip.totalTripEarnings,
      JSON.stringify(payslip.reimbursements), payslip.totalReimbursements,
      payslip.netPayable, payslip.status, payslip.generatedAt, payslip.generatedBy,
      payslip.exportedToAccounting,
    ]);
    return this.toPayslipDomain(result.rows[0]);
  }

  async updatePayslip(id: string, data: Partial<Payslip>): Promise<Payslip> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (data.status) { setClauses.push(`status = $${idx++}`); params.push(data.status); }
    if (data.approvedAt) { setClauses.push(`approved_at = $${idx++}`); params.push(data.approvedAt); }
    if (data.approvedBy) { setClauses.push(`approved_by = $${idx++}`); params.push(data.approvedBy); }
    if (data.paidAt) { setClauses.push(`paid_at = $${idx++}`); params.push(data.paidAt); }
    if (data.paymentMode) { setClauses.push(`payment_mode = $${idx++}`); params.push(data.paymentMode); }
    if (data.paymentReference) { setClauses.push(`payment_reference = $${idx++}`); params.push(data.paymentReference); }
    if (data.exportedToAccounting !== undefined) {
      setClauses.push(`exported_to_accounting = $${idx++}`); params.push(data.exportedToAccounting);
    }
    if (data.exportReference) { setClauses.push(`export_reference = $${idx++}`); params.push(data.exportReference); }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const query = `UPDATE hrms.payslips SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, params);
    return this.toPayslipDomain(result.rows[0]);
  }

  // Continued in part 2 file for bulk operations
  async generatePayslipsForPeriod(tenantId: string, period: PayPeriod): Promise<Payslip[]> {
    return this.findAllPayslips(tenantId, { year: period.year, month: period.month });
  }

  async approvePayslips(payslipIds: string[], approvedBy: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `UPDATE hrms.payslips SET status = 'APPROVED', approved_by = $1, approved_at = NOW() 
       WHERE id = ANY($2) AND tenant_id = $3`,
      [approvedBy, payslipIds, tenantId]
    );
  }

  async markAsPaid(ids: string[], paymentMode: string, paymentRef: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `UPDATE hrms.payslips SET status = 'PAID', payment_mode = $1, payment_reference = $2, paid_at = NOW()
       WHERE id = ANY($3) AND tenant_id = $4`,
      [paymentMode, paymentRef, ids, tenantId]
    );
  }

  async getPayrollSummary(tenantId: string, period: PayPeriod): Promise<PayrollSummary> {
    const query = `
      SELECT COUNT(*) as total, SUM(gross_earnings) as gross, SUM(total_deductions) as deductions,
        SUM(net_payable) as net, COUNT(*) FILTER (WHERE status = 'DRAFT') as draft,
        COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') as pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'PAID') as paid,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
      FROM hrms.payslips WHERE tenant_id = $1 AND year = $2 AND month = $3
    `;
    const result = await this.pool.query(query, [tenantId, period.year, period.month]);
    const r = result.rows[0];
    return {
      period, totalEmployees: parseInt(r.total, 10) || 0, totalGross: parseFloat(r.gross) || 0,
      totalDeductions: parseFloat(r.deductions) || 0, totalNet: parseFloat(r.net) || 0,
      byStatus: { DRAFT: parseInt(r.draft) || 0, PENDING_APPROVAL: parseInt(r.pending) || 0,
        APPROVED: parseInt(r.approved) || 0, PAID: parseInt(r.paid) || 0, CANCELLED: parseInt(r.cancelled) || 0 },
    };
  }

  async getPayslipsForExport(tenantId: string, period: PayPeriod): Promise<Payslip[]> {
    return this.findAllPayslips(tenantId, { year: period.year, month: period.month, status: 'APPROVED' });
  }

  async markAsExported(payslipIds: string[], exportReference: string): Promise<void> {
    await this.pool.query(
      `UPDATE hrms.payslips SET exported_to_accounting = true, export_reference = $1 WHERE id = ANY($2)`,
      [exportReference, payslipIds]
    );
  }

  private toStructureDomain(row: any): PayStructure {
    return {
      id: row.id, tenantId: row.tenant_id, employeeId: row.employee_id,
      effectiveFrom: new Date(row.effective_from),
      effectiveTo: row.effective_to ? new Date(row.effective_to) : undefined,
      payModel: row.pay_model as PayModel, baseSalary: parseFloat(row.base_salary) || 0,
      dailyRate: parseFloat(row.daily_rate) || 0, tripRate: parseFloat(row.trip_rate) || 0,
      hourlyRate: parseFloat(row.hourly_rate) || 0,
      components: typeof row.components === 'string' ? JSON.parse(row.components) : row.components || [],
      bankName: row.bank_name, accountNumber: row.account_number, ifscCode: row.ifsc_code,
      currency: row.currency, isActive: row.is_active,
      createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    };
  }

  private toPayslipDomain(row: any): Payslip {
    return {
      id: row.id, tenantId: row.tenant_id, employeeId: row.employee_id, payStructureId: row.pay_structure_id,
      period: { year: row.year, month: row.month, startDate: new Date(row.period_start), endDate: new Date(row.period_end) },
      presentDays: row.present_days, absentDays: row.absent_days, leaveDays: row.leave_days,
      tripDays: row.trip_days, overtimeHours: parseFloat(row.overtime_hours) || 0,
      earnings: typeof row.earnings === 'string' ? JSON.parse(row.earnings) : row.earnings || [],
      grossEarnings: parseFloat(row.gross_earnings) || 0,
      deductions: typeof row.deductions === 'string' ? JSON.parse(row.deductions) : row.deductions || [],
      totalDeductions: parseFloat(row.total_deductions) || 0,
      tripEarnings: typeof row.trip_earnings === 'string' ? JSON.parse(row.trip_earnings) : row.trip_earnings || [],
      totalTripEarnings: parseFloat(row.total_trip_earnings) || 0,
      reimbursements: typeof row.reimbursements === 'string' ? JSON.parse(row.reimbursements) : row.reimbursements || [],
      totalReimbursements: parseFloat(row.total_reimbursements) || 0,
      netPayable: parseFloat(row.net_payable) || 0, status: row.status as PayslipStatus,
      generatedAt: new Date(row.generated_at), generatedBy: row.generated_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined, approvedBy: row.approved_by,
      paidAt: row.paid_at ? new Date(row.paid_at) : undefined, paymentMode: row.payment_mode,
      paymentReference: row.payment_reference, exportedToAccounting: row.exported_to_accounting,
      exportReference: row.export_reference, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    };
  }
}
