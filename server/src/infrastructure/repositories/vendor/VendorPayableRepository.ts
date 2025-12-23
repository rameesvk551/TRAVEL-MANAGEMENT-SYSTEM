import { query } from '../../database/index.js';
import { VendorPayable, PayableStatus } from '../../../domain/entities/vendor/index.js';
import { IVendorPayableRepository, PayableFilters, PayableSummary } from '../../../domain/interfaces/vendor/index.js';

interface PayableRow {
    id: string;
    tenant_id: string;
    vendor_id: string;
    assignment_id: string | null;
    payable_number: string | null;
    gross_amount: string;
    advance_paid: string;
    deductions: string;
    penalties: string;
    adjustments: string;
    tax_amount: string;
    net_payable: string;
    currency: string;
    deduction_details: unknown[];
    due_date: Date | null;
    status: PayableStatus;
    approved_at: Date | null;
    approved_by: string | null;
    amount_settled: string;
    notes: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: PayableRow): VendorPayable {
    return VendorPayable.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        vendorId: row.vendor_id,
        assignmentId: row.assignment_id ?? undefined,
        payableNumber: row.payable_number ?? undefined,
        grossAmount: parseFloat(row.gross_amount),
        advancePaid: parseFloat(row.advance_paid),
        deductions: parseFloat(row.deductions),
        penalties: parseFloat(row.penalties),
        adjustments: parseFloat(row.adjustments),
        taxAmount: parseFloat(row.tax_amount),
        netPayable: parseFloat(row.net_payable),
        currency: row.currency,
        deductionDetails: row.deduction_details as VendorPayable['deductionDetails'],
        dueDate: row.due_date ?? undefined,
        status: row.status,
        approvedAt: row.approved_at ?? undefined,
        approvedBy: row.approved_by ?? undefined,
        amountSettled: parseFloat(row.amount_settled),
        notes: row.notes ?? undefined,
        createdBy: row.created_by ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

function buildWhereClause(tenantId: string, filters?: PayableFilters): { clause: string; params: unknown[] } {
    const conditions = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters?.vendorId) { conditions.push(`vendor_id = $${idx++}`); params.push(filters.vendorId); }
    if (filters?.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters?.dueDateFrom) { conditions.push(`due_date >= $${idx++}`); params.push(filters.dueDateFrom); }
    if (filters?.dueDateTo) { conditions.push(`due_date <= $${idx++}`); params.push(filters.dueDateTo); }

    return { clause: conditions.join(' AND '), params };
}

export class VendorPayableRepository implements IVendorPayableRepository {
    async findById(id: string, tenantId: string): Promise<VendorPayable | null> {
        const result = await query<PayableRow>('SELECT * FROM vendor_payables WHERE id=$1 AND tenant_id=$2', [id, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByNumber(payableNumber: string, tenantId: string): Promise<VendorPayable | null> {
        const result = await query<PayableRow>(
            'SELECT * FROM vendor_payables WHERE payable_number=$1 AND tenant_id=$2',
            [payableNumber, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByVendor(vendorId: string, tenantId: string): Promise<VendorPayable[]> {
        const result = await query<PayableRow>(
            'SELECT * FROM vendor_payables WHERE vendor_id=$1 AND tenant_id=$2 ORDER BY created_at DESC',
            [vendorId, tenantId]
        );
        return result.rows.map(toEntity);
    }

    async findByAssignment(assignmentId: string, tenantId: string): Promise<VendorPayable | null> {
        const result = await query<PayableRow>(
            'SELECT * FROM vendor_payables WHERE assignment_id=$1 AND tenant_id=$2',
            [assignmentId, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string, filters?: PayableFilters, limit = 20, offset = 0): Promise<VendorPayable[]> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const sql = `SELECT * FROM vendor_payables WHERE ${clause} ORDER BY due_date NULLS LAST, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const result = await query<PayableRow>(sql, [...params, limit, offset]);
        return result.rows.map(toEntity);
    }

    async count(tenantId: string, filters?: PayableFilters): Promise<number> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const result = await query<{ count: string }>(`SELECT COUNT(*) as count FROM vendor_payables WHERE ${clause}`, params);
        return parseInt(result.rows[0].count, 10);
    }

    async save(payable: VendorPayable): Promise<VendorPayable> {
        const sql = `INSERT INTO vendor_payables (
            id, tenant_id, vendor_id, assignment_id, gross_amount, advance_paid, deductions,
            penalties, adjustments, tax_amount, net_payable, currency, deduction_details,
            due_date, status, notes, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`;
        const result = await query<PayableRow>(sql, [
            payable.id, payable.tenantId, payable.vendorId, payable.assignmentId,
            payable.grossAmount, payable.advancePaid, payable.deductions, payable.penalties,
            payable.adjustments, payable.taxAmount, payable.netPayable, payable.currency,
            JSON.stringify(payable.deductionDetails), payable.dueDate, payable.status,
            payable.notes, payable.createdBy
        ]);
        return toEntity(result.rows[0]);
    }

    async update(payable: VendorPayable): Promise<VendorPayable> {
        const sql = `UPDATE vendor_payables SET
            gross_amount=$2, advance_paid=$3, deductions=$4, penalties=$5, adjustments=$6,
            tax_amount=$7, net_payable=$8, deduction_details=$9, due_date=$10, notes=$11
        WHERE id=$1 AND tenant_id=$12 RETURNING *`;
        const result = await query<PayableRow>(sql, [
            payable.id, payable.grossAmount, payable.advancePaid, payable.deductions, payable.penalties,
            payable.adjustments, payable.taxAmount, payable.netPayable,
            JSON.stringify(payable.deductionDetails), payable.dueDate, payable.notes, payable.tenantId
        ]);
        return toEntity(result.rows[0]);
    }

    async updateStatus(id: string, tenantId: string, status: PayableStatus): Promise<void> {
        await query('UPDATE vendor_payables SET status=$1 WHERE id=$2 AND tenant_id=$3', [status, id, tenantId]);
    }

    async updateSettledAmount(id: string, tenantId: string, amount: number): Promise<void> {
        await query(
            `UPDATE vendor_payables SET amount_settled = amount_settled + $1,
             status = CASE WHEN amount_settled + $1 >= net_payable THEN 'FULLY_SETTLED' ELSE 'PARTIALLY_SETTLED' END
             WHERE id=$2 AND tenant_id=$3`,
            [amount, id, tenantId]
        );
    }

    async findOverdue(tenantId: string): Promise<VendorPayable[]> {
        const result = await query<PayableRow>(
            `SELECT * FROM vendor_payables WHERE tenant_id=$1 
             AND due_date < CURRENT_DATE AND status IN ('PENDING','APPROVED','PARTIALLY_SETTLED')
             ORDER BY due_date`,
            [tenantId]
        );
        return result.rows.map(toEntity);
    }

    async findPendingByVendor(vendorId: string, tenantId: string): Promise<VendorPayable[]> {
        const result = await query<PayableRow>(
            `SELECT * FROM vendor_payables WHERE vendor_id=$1 AND tenant_id=$2 
             AND status IN ('PENDING','APPROVED','PARTIALLY_SETTLED') ORDER BY due_date`,
            [vendorId, tenantId]
        );
        return result.rows.map(toEntity);
    }

    async getSummary(tenantId: string): Promise<PayableSummary> {
        const result = await query<{ status: PayableStatus; total: string }>(
            `SELECT status, COALESCE(SUM(net_payable),0) as total FROM vendor_payables 
             WHERE tenant_id=$1 GROUP BY status`,
            [tenantId]
        );
        const summary: PayableSummary = { totalPending: 0, totalApproved: 0, totalSettled: 0, totalOnHold: 0, totalDisputed: 0 };
        for (const row of result.rows) {
            if (row.status === 'PENDING') summary.totalPending = parseFloat(row.total);
            if (row.status === 'APPROVED') summary.totalApproved = parseFloat(row.total);
            if (row.status === 'FULLY_SETTLED') summary.totalSettled = parseFloat(row.total);
            if (row.status === 'ON_HOLD') summary.totalOnHold = parseFloat(row.total);
            if (row.status === 'DISPUTED') summary.totalDisputed = parseFloat(row.total);
        }
        return summary;
    }

    async getVendorSummary(vendorId: string, tenantId: string): Promise<PayableSummary> {
        const result = await query<{ status: PayableStatus; total: string }>(
            `SELECT status, COALESCE(SUM(net_payable),0) as total FROM vendor_payables 
             WHERE vendor_id=$1 AND tenant_id=$2 GROUP BY status`,
            [vendorId, tenantId]
        );
        const summary: PayableSummary = { totalPending: 0, totalApproved: 0, totalSettled: 0, totalOnHold: 0, totalDisputed: 0 };
        for (const row of result.rows) {
            if (row.status === 'PENDING') summary.totalPending = parseFloat(row.total);
            if (row.status === 'APPROVED') summary.totalApproved = parseFloat(row.total);
            if (row.status === 'FULLY_SETTLED') summary.totalSettled = parseFloat(row.total);
            if (row.status === 'ON_HOLD') summary.totalOnHold = parseFloat(row.total);
            if (row.status === 'DISPUTED') summary.totalDisputed = parseFloat(row.total);
        }
        return summary;
    }
}
