import { Pool } from 'pg';
import { VendorContract, VendorContractProps } from '../../../domain/entities/vendor/VendorContract';
import { IVendorContractRepository, VendorContractFilters } from '../../../domain/interfaces/vendor/IVendorContractRepository';

export class VendorContractRepository implements IVendorContractRepository {
    constructor(private pool: Pool) {}

    async findById(id: string): Promise<VendorContract | null> {
        const result = await this.pool.query(
            `SELECT * FROM vendor_contracts WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) return null;
        return this.mapToEntity(result.rows[0]);
    }

    async findByVendorId(vendorId: string): Promise<VendorContract[]> {
        const result = await this.pool.query(
            `SELECT * FROM vendor_contracts WHERE vendor_id = $1 ORDER BY valid_from DESC`,
            [vendorId]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async findAll(filters: VendorContractFilters): Promise<{ data: VendorContract[]; total: number }> {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.tenantId) {
            conditions.push(`tenant_id = $${paramIndex++}`);
            params.push(filters.tenantId);
        }

        if (filters.vendorId) {
            conditions.push(`vendor_id = $${paramIndex++}`);
            params.push(filters.vendorId);
        }

        if (filters.status) {
            conditions.push(`status = $${paramIndex++}`);
            params.push(filters.status);
        }

        if (filters.contractType) {
            conditions.push(`contract_type = $${paramIndex++}`);
            params.push(filters.contractType);
        }

        if (filters.validOn) {
            conditions.push(`valid_from <= $${paramIndex} AND valid_to >= $${paramIndex++}`);
            params.push(filters.validOn);
        }

        if (filters.search) {
            conditions.push(`(name ILIKE $${paramIndex} OR contract_number ILIKE $${paramIndex++})`);
            params.push(`%${filters.search}%`);
        }

        const whereClause = conditions.join(' AND ');
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM vendor_contracts WHERE ${whereClause}`,
            params
        );

        const dataResult = await this.pool.query(
            `SELECT * FROM vendor_contracts 
             WHERE ${whereClause} 
             ORDER BY created_at DESC 
             LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            [...params, limit, offset]
        );

        return {
            data: dataResult.rows.map(row => this.mapToEntity(row)),
            total: parseInt(countResult.rows[0].count),
        };
    }

    async findActiveByVendor(vendorId: string, date: Date = new Date()): Promise<VendorContract[]> {
        const result = await this.pool.query(
            `SELECT * FROM vendor_contracts 
             WHERE vendor_id = $1 
             AND status = 'active'
             AND valid_from <= $2 
             AND valid_to >= $2
             ORDER BY valid_from DESC`,
            [vendorId, date]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async findExpiring(daysAhead: number): Promise<VendorContract[]> {
        const result = await this.pool.query(
            `SELECT * FROM vendor_contracts 
             WHERE status = 'active'
             AND valid_to BETWEEN CURRENT_DATE AND CURRENT_DATE + $1 * INTERVAL '1 day'
             ORDER BY valid_to ASC`,
            [daysAhead]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async save(contract: VendorContract): Promise<VendorContract> {
        const props = contract.toObject();
        
        const result = await this.pool.query(
            `INSERT INTO vendor_contracts (
                id, tenant_id, vendor_id, contract_number, name, contract_type,
                valid_from, valid_to, auto_renew, renewal_notice_days,
                terms_and_conditions, payment_terms, commission_percentage,
                minimum_commitment, contract_value, currency, status,
                signed_date, signed_by, document_url, notes, metadata,
                created_by, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
            )
            ON CONFLICT (id) DO UPDATE SET
                contract_number = EXCLUDED.contract_number,
                name = EXCLUDED.name,
                contract_type = EXCLUDED.contract_type,
                valid_from = EXCLUDED.valid_from,
                valid_to = EXCLUDED.valid_to,
                auto_renew = EXCLUDED.auto_renew,
                renewal_notice_days = EXCLUDED.renewal_notice_days,
                terms_and_conditions = EXCLUDED.terms_and_conditions,
                payment_terms = EXCLUDED.payment_terms,
                commission_percentage = EXCLUDED.commission_percentage,
                minimum_commitment = EXCLUDED.minimum_commitment,
                contract_value = EXCLUDED.contract_value,
                currency = EXCLUDED.currency,
                status = EXCLUDED.status,
                signed_date = EXCLUDED.signed_date,
                signed_by = EXCLUDED.signed_by,
                document_url = EXCLUDED.document_url,
                notes = EXCLUDED.notes,
                metadata = EXCLUDED.metadata,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [
                props.id,
                props.tenantId,
                props.vendorId,
                props.contractNumber,
                props.name,
                props.contractType,
                props.validFrom,
                props.validTo,
                props.autoRenew,
                props.renewalNoticeDays,
                props.termsAndConditions,
                props.paymentTerms,
                props.commissionPercentage,
                props.minimumCommitment,
                props.contractValue,
                props.currency,
                props.status,
                props.signedDate,
                props.signedBy,
                props.documentUrl,
                props.notes,
                JSON.stringify(props.metadata),
                props.createdBy,
                props.createdAt,
                props.updatedAt,
            ]
        );

        return this.mapToEntity(result.rows[0]);
    }

    async delete(id: string): Promise<void> {
        await this.pool.query(`DELETE FROM vendor_contracts WHERE id = $1`, [id]);
    }

    private mapToEntity(row: any): VendorContract {
        return VendorContract.create({
            id: row.id,
            tenantId: row.tenant_id,
            vendorId: row.vendor_id,
            contractNumber: row.contract_number,
            name: row.name,
            contractType: row.contract_type,
            validFrom: row.valid_from,
            validTo: row.valid_to,
            autoRenew: row.auto_renew,
            renewalNoticeDays: row.renewal_notice_days,
            termsAndConditions: row.terms_and_conditions,
            paymentTerms: row.payment_terms,
            commissionPercentage: row.commission_percentage ? parseFloat(row.commission_percentage) : undefined,
            minimumCommitment: row.minimum_commitment ? parseFloat(row.minimum_commitment) : undefined,
            contractValue: row.contract_value ? parseFloat(row.contract_value) : undefined,
            currency: row.currency,
            status: row.status,
            signedDate: row.signed_date,
            signedBy: row.signed_by,
            documentUrl: row.document_url,
            notes: row.notes,
            metadata: row.metadata,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}
