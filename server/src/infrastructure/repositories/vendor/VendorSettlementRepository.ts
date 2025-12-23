import { query } from '../../database/index.js';
import { VendorSettlement, SettlementMethod } from '../../../domain/entities/vendor/index.js';
import { IVendorSettlementRepository, SettlementFilters, SettlementSummary } from '../../../domain/interfaces/vendor/index.js';

interface SettlementRow {
    id: string;
    tenant_id: string;
    vendor_id: string;
    settlement_number: string | null;
    payable_ids: string[];
    amount: string;
    currency: string;
    payment_method: SettlementMethod;
    payment_reference: string | null;
    payment_date: Date;
    bank_details_snapshot: Record<string, unknown>;
    is_verified: boolean;
    verified_at: Date | null;
    verified_by: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: SettlementRow): VendorSettlement {
    return VendorSettlement.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        vendorId: row.vendor_id,
        settlementNumber: row.settlement_number ?? undefined,
        payableIds: row.payable_ids ?? [],
        amount: parseFloat(row.amount),
        currency: row.currency,
        paymentMethod: row.payment_method,
        paymentReference: row.payment_reference ?? undefined,
        paymentDate: row.payment_date,
        bankDetailsSnapshot: row.bank_details_snapshot as VendorSettlement['bankDetailsSnapshot'],
        isVerified: row.is_verified,
        verifiedAt: row.verified_at ?? undefined,
        verifiedBy: row.verified_by ?? undefined,
        notes: row.notes ?? undefined,
        createdBy: row.created_by ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

function buildWhereClause(tenantId: string, filters?: SettlementFilters): { clause: string; params: unknown[] } {
    const conditions = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters?.vendorId) { conditions.push(`vendor_id = $${idx++}`); params.push(filters.vendorId); }
    if (filters?.paymentMethod) { conditions.push(`payment_method = $${idx++}`); params.push(filters.paymentMethod); }
    if (filters?.isVerified !== undefined) { conditions.push(`is_verified = $${idx++}`); params.push(filters.isVerified); }
    if (filters?.paymentDateFrom) { conditions.push(`payment_date >= $${idx++}`); params.push(filters.paymentDateFrom); }
    if (filters?.paymentDateTo) { conditions.push(`payment_date <= $${idx++}`); params.push(filters.paymentDateTo); }

    return { clause: conditions.join(' AND '), params };
}

export class VendorSettlementRepository implements IVendorSettlementRepository {
    async findById(id: string, tenantId: string): Promise<VendorSettlement | null> {
        const result = await query<SettlementRow>('SELECT * FROM vendor_settlements WHERE id=$1 AND tenant_id=$2', [id, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByNumber(settlementNumber: string, tenantId: string): Promise<VendorSettlement | null> {
        const result = await query<SettlementRow>(
            'SELECT * FROM vendor_settlements WHERE settlement_number=$1 AND tenant_id=$2',
            [settlementNumber, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByVendor(vendorId: string, tenantId: string): Promise<VendorSettlement[]> {
        const result = await query<SettlementRow>(
            'SELECT * FROM vendor_settlements WHERE vendor_id=$1 AND tenant_id=$2 ORDER BY payment_date DESC',
            [vendorId, tenantId]
        );
        return result.rows.map(toEntity);
    }

    async findByPayable(payableId: string, tenantId: string): Promise<VendorSettlement[]> {
        const result = await query<SettlementRow>(
            `SELECT s.* FROM vendor_settlements s 
             JOIN vendor_settlement_payables sp ON s.id = sp.settlement_id 
             WHERE sp.payable_id=$1 AND s.tenant_id=$2`,
            [payableId, tenantId]
        );
        return result.rows.map(toEntity);
    }

    async findAll(tenantId: string, filters?: SettlementFilters, limit = 20, offset = 0): Promise<VendorSettlement[]> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const sql = `SELECT * FROM vendor_settlements WHERE ${clause} ORDER BY payment_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const result = await query<SettlementRow>(sql, [...params, limit, offset]);
        return result.rows.map(toEntity);
    }

    async count(tenantId: string, filters?: SettlementFilters): Promise<number> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const result = await query<{ count: string }>(`SELECT COUNT(*) as count FROM vendor_settlements WHERE ${clause}`, params);
        return parseInt(result.rows[0].count, 10);
    }

    async save(settlement: VendorSettlement): Promise<VendorSettlement> {
        const sql = `INSERT INTO vendor_settlements (
            id, tenant_id, vendor_id, payable_ids, amount, currency, payment_method,
            payment_reference, payment_date, bank_details_snapshot, notes, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`;
        const result = await query<SettlementRow>(sql, [
            settlement.id, settlement.tenantId, settlement.vendorId, settlement.payableIds,
            settlement.amount, settlement.currency, settlement.paymentMethod, settlement.paymentReference,
            settlement.paymentDate, JSON.stringify(settlement.bankDetailsSnapshot),
            settlement.notes, settlement.createdBy
        ]);
        return toEntity(result.rows[0]);
    }

    async update(settlement: VendorSettlement): Promise<VendorSettlement> {
        const sql = `UPDATE vendor_settlements SET
            payment_reference=$2, notes=$3
        WHERE id=$1 AND tenant_id=$4 RETURNING *`;
        const result = await query<SettlementRow>(sql, [
            settlement.id, settlement.paymentReference, settlement.notes, settlement.tenantId
        ]);
        return toEntity(result.rows[0]);
    }

    async verify(id: string, tenantId: string, verifiedBy: string): Promise<void> {
        await query(
            'UPDATE vendor_settlements SET is_verified=true, verified_at=NOW(), verified_by=$1 WHERE id=$2 AND tenant_id=$3',
            [verifiedBy, id, tenantId]
        );
    }

    async getSummary(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<SettlementSummary> {
        let sql = `SELECT payment_method, COALESCE(SUM(amount),0) as total, COUNT(*) as cnt 
                   FROM vendor_settlements WHERE tenant_id=$1`;
        const params: unknown[] = [tenantId];
        
        if (dateFrom) { sql += ` AND payment_date >= $${params.length + 1}`; params.push(dateFrom); }
        if (dateTo) { sql += ` AND payment_date <= $${params.length + 1}`; params.push(dateTo); }
        sql += ' GROUP BY payment_method';

        const result = await query<{ payment_method: SettlementMethod; total: string; cnt: string }>(sql, params);
        
        const summary: SettlementSummary = {
            totalAmount: 0, count: 0,
            byMethod: { BANK_TRANSFER: 0, UPI: 0, CASH: 0, CHEQUE: 0, ADJUSTMENT: 0 }
        };
        
        for (const row of result.rows) {
            const amt = parseFloat(row.total);
            summary.totalAmount += amt;
            summary.count += parseInt(row.cnt, 10);
            summary.byMethod[row.payment_method] = amt;
        }
        return summary;
    }

    async getVendorSummary(vendorId: string, tenantId: string): Promise<SettlementSummary> {
        const result = await query<{ payment_method: SettlementMethod; total: string; cnt: string }>(
            `SELECT payment_method, COALESCE(SUM(amount),0) as total, COUNT(*) as cnt 
             FROM vendor_settlements WHERE vendor_id=$1 AND tenant_id=$2 GROUP BY payment_method`,
            [vendorId, tenantId]
        );
        
        const summary: SettlementSummary = {
            totalAmount: 0, count: 0,
            byMethod: { BANK_TRANSFER: 0, UPI: 0, CASH: 0, CHEQUE: 0, ADJUSTMENT: 0 }
        };
        
        for (const row of result.rows) {
            const amt = parseFloat(row.total);
            summary.totalAmount += amt;
            summary.count += parseInt(row.cnt, 10);
            summary.byMethod[row.payment_method] = amt;
        }
        return summary;
    }

    async linkPayables(settlementId: string, payableAmounts: Array<{ payableId: string; amount: number }>): Promise<void> {
        for (const { payableId, amount } of payableAmounts) {
            await query(
                `INSERT INTO vendor_settlement_payables (settlement_id, payable_id, amount_applied) 
                 VALUES ($1, $2, $3) ON CONFLICT (settlement_id, payable_id) DO UPDATE SET amount_applied = $3`,
                [settlementId, payableId, amount]
            );
        }
    }
}
