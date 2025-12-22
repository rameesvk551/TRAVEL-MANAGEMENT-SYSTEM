// infrastructure/repositories/hrms/ExpenseRepository.ts
// Expense Repository Implementation

import { Pool } from 'pg';
import type { ExpenseClaim, ExpenseItem, ExpenseStatus } from '../../../domain/entities/hrms/Expense';
import type { 
  IExpenseRepository, 
  ExpenseFilters,
  ExpenseStats 
} from '../../../domain/interfaces/hrms/IExpenseRepository';

export class ExpenseRepository implements IExpenseRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<ExpenseClaim | null> {
    const query = `
      SELECT ec.*, 
        CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM hrms.expense_claims ec
      LEFT JOIN hrms.employees e ON ec.employee_id = e.id
      WHERE ec.id = $1
    `;
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    const itemsQuery = `SELECT * FROM hrms.expense_items WHERE claim_id = $1 ORDER BY date`;
    const itemsResult = await this.pool.query(itemsQuery, [id]);

    return this.mapToEntity(result.rows[0], itemsResult.rows);
  }

  async findByClaimNumber(claimNumber: string): Promise<ExpenseClaim | null> {
    const query = `SELECT id FROM hrms.expense_claims WHERE claim_number = $1`;
    const result = await this.pool.query(query, [claimNumber]);
    if (result.rows.length === 0) return null;
    return this.findById(result.rows[0].id);
  }

  async findAll(filters: ExpenseFilters): Promise<ExpenseClaim[]> {
    const conditions: string[] = ['ec.tenant_id = $1'];
    const params: unknown[] = [filters.tenantId];
    let paramIndex = 2;

    if (filters.employeeId) {
      conditions.push(`ec.employee_id = $${paramIndex++}`);
      params.push(filters.employeeId);
    }

    if (filters.status) {
      conditions.push(`ec.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.tripId) {
      conditions.push(`ec.trip_id = $${paramIndex++}`);
      params.push(filters.tripId);
    }

    if (filters.startDate) {
      conditions.push(`ec.created_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`ec.created_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const query = `
      SELECT ec.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM hrms.expense_claims ec
      LEFT JOIN hrms.employees e ON ec.employee_id = e.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ec.created_at DESC
    `;

    const result = await this.pool.query(query, params);
    const claims: ExpenseClaim[] = [];

    for (const row of result.rows) {
      const itemsQuery = `SELECT * FROM hrms.expense_items WHERE claim_id = $1`;
      const itemsResult = await this.pool.query(itemsQuery, [row.id]);
      claims.push(this.mapToEntity(row, itemsResult.rows));
    }

    return claims;
  }

  async findByEmployee(employeeId: string, tenantId: string): Promise<ExpenseClaim[]> {
    return this.findAll({ tenantId, employeeId });
  }

  async findPendingApproval(tenantId: string, approverId?: string): Promise<ExpenseClaim[]> {
    return this.findAll({ tenantId, status: 'SUBMITTED' });
  }

  async create(expense: Omit<ExpenseClaim, 'id'>): Promise<ExpenseClaim> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const claimQuery = `
        INSERT INTO hrms.expense_claims (
          tenant_id, employee_id, claim_number, title, description,
          trip_id, total_amount, currency, status, attachments, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const claimResult = await client.query(claimQuery, [
        expense.tenantId,
        expense.employeeId,
        expense.claimNumber,
        expense.title,
        expense.description,
        expense.tripId,
        expense.totalAmount,
        expense.currency,
        expense.status,
        JSON.stringify(expense.attachments),
        expense.createdBy,
      ]);

      const claimId = claimResult.rows[0].id;

      // Insert items
      for (const item of expense.items) {
        await client.query(`
          INSERT INTO hrms.expense_items (
            claim_id, description, category, amount, currency,
            date, payment_method, receipt_url, receipt_file_name, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          claimId,
          item.description,
          item.category,
          item.amount,
          item.currency,
          item.date,
          item.paymentMethod,
          item.receiptUrl,
          item.receiptFileName,
          item.notes,
        ]);
      }

      await client.query('COMMIT');
      return this.findById(claimId) as Promise<ExpenseClaim>;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, expense: Partial<ExpenseClaim>): Promise<ExpenseClaim | null> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      status: 'status',
      totalAmount: 'total_amount',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in expense) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push((expense as Record<string, unknown>)[key]);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.expense_claims
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows.length > 0 ? this.findById(id) : null;
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM hrms.expense_items WHERE claim_id = $1`, [id]);
      const result = await client.query(`DELETE FROM hrms.expense_claims WHERE id = $1`, [id]);
      await client.query('COMMIT');
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async submit(id: string): Promise<ExpenseClaim | null> {
    const query = `
      UPDATE hrms.expense_claims
      SET status = 'SUBMITTED', submitted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'DRAFT'
      RETURNING *
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.findById(id) : null;
  }

  async approve(id: string, approverId: string, comments?: string): Promise<ExpenseClaim | null> {
    const query = `
      UPDATE hrms.expense_claims
      SET status = 'APPROVED', approved_by = $2, approved_at = NOW(), 
          approval_comments = $3, updated_at = NOW()
      WHERE id = $1 AND status IN ('SUBMITTED', 'UNDER_REVIEW')
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, approverId, comments]);
    return result.rows.length > 0 ? this.findById(id) : null;
  }

  async reject(id: string, rejectorId: string, reason: string): Promise<ExpenseClaim | null> {
    const query = `
      UPDATE hrms.expense_claims
      SET status = 'REJECTED', rejected_by = $2, rejected_at = NOW(), 
          rejection_reason = $3, updated_at = NOW()
      WHERE id = $1 AND status IN ('SUBMITTED', 'UNDER_REVIEW')
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, rejectorId, reason]);
    return result.rows.length > 0 ? this.findById(id) : null;
  }

  async markAsPaid(id: string, paymentReference: string): Promise<ExpenseClaim | null> {
    const query = `
      UPDATE hrms.expense_claims
      SET status = 'PAID', paid_at = NOW(), payment_reference = $2, updated_at = NOW()
      WHERE id = $1 AND status = 'APPROVED'
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, paymentReference]);
    return result.rows.length > 0 ? this.findById(id) : null;
  }

  async getStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<ExpenseStats> {
    let dateCondition = '';
    const params: unknown[] = [tenantId];

    if (startDate && endDate) {
      dateCondition = ' AND created_at >= $2 AND created_at <= $3';
      params.push(startDate, endDate);
    }

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_claims,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status IN ('SUBMITTED', 'UNDER_REVIEW') THEN total_amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN total_amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END), 0) as paid_amount
      FROM hrms.expense_claims
      WHERE tenant_id = $1 ${dateCondition}
    `;

    const summaryResult = await this.pool.query(summaryQuery, params);

    const categoryQuery = `
      SELECT 
        ei.category,
        SUM(ei.amount) as amount,
        COUNT(*) as count
      FROM hrms.expense_items ei
      JOIN hrms.expense_claims ec ON ei.claim_id = ec.id
      WHERE ec.tenant_id = $1 ${dateCondition}
      GROUP BY ei.category
      ORDER BY amount DESC
    `;

    const categoryResult = await this.pool.query(categoryQuery, params);

    const monthQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(total_amount) as amount,
        COUNT(*) as count
      FROM hrms.expense_claims
      WHERE tenant_id = $1 ${dateCondition}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `;

    const monthResult = await this.pool.query(monthQuery, params);

    const summary = summaryResult.rows[0];
    return {
      totalClaims: parseInt(summary.total_claims, 10),
      totalAmount: parseFloat(summary.total_amount),
      pendingAmount: parseFloat(summary.pending_amount),
      approvedAmount: parseFloat(summary.approved_amount),
      paidAmount: parseFloat(summary.paid_amount),
      byCategory: categoryResult.rows.map(row => ({
        category: row.category,
        amount: parseFloat(row.amount),
        count: parseInt(row.count, 10),
      })),
      byMonth: monthResult.rows.map(row => ({
        month: row.month,
        amount: parseFloat(row.amount),
        count: parseInt(row.count, 10),
      })),
    };
  }

  async getEmployeeExpenseTotal(employeeId: string, startDate: Date, endDate: Date): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM hrms.expense_claims
      WHERE employee_id = $1 AND created_at >= $2 AND created_at <= $3
        AND status IN ('APPROVED', 'PAID')
    `;
    const result = await this.pool.query(query, [employeeId, startDate, endDate]);
    return parseFloat(result.rows[0].total);
  }

  private mapToEntity(row: Record<string, unknown>, itemRows: Record<string, unknown>[]): ExpenseClaim {
    const items: ExpenseItem[] = itemRows.map(item => ({
      id: item.id as string,
      description: item.description as string,
      category: item.category as ExpenseItem['category'],
      amount: parseFloat(item.amount as string),
      currency: item.currency as string,
      date: new Date(item.date as string),
      paymentMethod: item.payment_method as ExpenseItem['paymentMethod'],
      receiptUrl: item.receipt_url as string | undefined,
      receiptFileName: item.receipt_file_name as string | undefined,
      notes: item.notes as string | undefined,
    }));

    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      employeeId: row.employee_id as string,
      employeeName: row.employee_name as string | undefined,
      claimNumber: row.claim_number as string,
      title: row.title as string,
      description: row.description as string | undefined,
      tripId: row.trip_id as string | undefined,
      tripName: row.trip_name as string | undefined,
      items,
      totalAmount: parseFloat(row.total_amount as string),
      currency: row.currency as string,
      status: row.status as ExpenseStatus,
      submittedAt: row.submitted_at ? new Date(row.submitted_at as string) : undefined,
      reviewedBy: row.reviewed_by as string | undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at as string) : undefined,
      reviewerComments: row.reviewer_comments as string | undefined,
      approvedBy: row.approved_by as string | undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
      approvalComments: row.approval_comments as string | undefined,
      rejectedBy: row.rejected_by as string | undefined,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at as string) : undefined,
      rejectionReason: row.rejection_reason as string | undefined,
      paidAt: row.paid_at ? new Date(row.paid_at as string) : undefined,
      paymentReference: row.payment_reference as string | undefined,
      attachments: row.attachments ? JSON.parse(row.attachments as string) : [],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string,
    };
  }
}
