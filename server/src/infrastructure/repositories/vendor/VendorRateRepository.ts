import { Pool } from 'pg';
import { VendorRate, VendorRateProps } from '../../../domain/entities/vendor/VendorRate';
import { IVendorRateRepository, VendorRateFilters } from '../../../domain/interfaces/vendor/IVendorRateRepository';

export class VendorRateRepository implements IVendorRateRepository {
    constructor(private pool: Pool) {}

    async findById(id: string): Promise<VendorRate | null> {
        const result = await this.pool.query(
            `SELECT * FROM vendor_rates WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) return null;
        return this.mapToEntity(result.rows[0]);
    }

    async findByContractId(contractId: string): Promise<VendorRate[]> {
        const result = await this.pool.query(
            `SELECT * FROM vendor_rates WHERE contract_id = $1 ORDER BY valid_from DESC`,
            [contractId]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async findAll(filters: VendorRateFilters): Promise<{ data: VendorRate[]; total: number }> {
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

        if (filters.contractId) {
            conditions.push(`contract_id = $${paramIndex++}`);
            params.push(filters.contractId);
        }

        if (filters.serviceType) {
            conditions.push(`service_type = $${paramIndex++}`);
            params.push(filters.serviceType);
        }

        if (filters.rateType) {
            conditions.push(`rate_type = $${paramIndex++}`);
            params.push(filters.rateType);
        }

        if (filters.isActive !== undefined) {
            conditions.push(`is_active = $${paramIndex++}`);
            params.push(filters.isActive);
        }

        if (filters.validOn) {
            conditions.push(`valid_from <= $${paramIndex} AND (valid_to IS NULL OR valid_to >= $${paramIndex++})`);
            params.push(filters.validOn);
        }

        const whereClause = conditions.join(' AND ');
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM vendor_rates WHERE ${whereClause}`,
            params
        );

        const dataResult = await this.pool.query(
            `SELECT * FROM vendor_rates 
             WHERE ${whereClause} 
             ORDER BY version DESC, created_at DESC 
             LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            [...params, limit, offset]
        );

        return {
            data: dataResult.rows.map(row => this.mapToEntity(row)),
            total: parseInt(countResult.rows[0].count),
        };
    }

    async findApplicableRate(
        vendorId: string,
        serviceType: string,
        date: Date
    ): Promise<VendorRate | null> {
        const result = await this.pool.query(
            `SELECT * FROM vendor_rates 
             WHERE vendor_id = $1 
             AND service_type = $2
             AND is_active = true
             AND valid_from <= $3 
             AND (valid_to IS NULL OR valid_to >= $3)
             ORDER BY version DESC, valid_from DESC
             LIMIT 1`,
            [vendorId, serviceType, date]
        );

        if (result.rows.length === 0) return null;
        return this.mapToEntity(result.rows[0]);
    }

    async findSeasonalRates(
        vendorId: string,
        serviceType: string,
        startDate: Date,
        endDate: Date
    ): Promise<VendorRate[]> {
        const result = await this.pool.query(
            `SELECT * FROM vendor_rates 
             WHERE vendor_id = $1 
             AND service_type = $2
             AND is_active = true
             AND (
                 (valid_from <= $3 AND (valid_to IS NULL OR valid_to >= $3))
                 OR (valid_from <= $4 AND (valid_to IS NULL OR valid_to >= $4))
                 OR (valid_from >= $3 AND valid_to <= $4)
             )
             ORDER BY valid_from ASC`,
            [vendorId, serviceType, startDate, endDate]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async save(rate: VendorRate): Promise<VendorRate> {
        const props = rate.toObject();
        
        const result = await this.pool.query(
            `INSERT INTO vendor_rates (
                id, tenant_id, vendor_id, contract_id, service_type, service_code,
                rate_name, rate_type, base_rate, currency, unit_of_measure,
                minimum_units, maximum_units, valid_from, valid_to,
                season_type, day_of_week_rates, group_size_rates,
                early_bird_discount, last_minute_rate, cancellation_charges,
                version, is_active, notes, metadata,
                created_by, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
            )
            ON CONFLICT (id) DO UPDATE SET
                service_type = EXCLUDED.service_type,
                service_code = EXCLUDED.service_code,
                rate_name = EXCLUDED.rate_name,
                rate_type = EXCLUDED.rate_type,
                base_rate = EXCLUDED.base_rate,
                currency = EXCLUDED.currency,
                unit_of_measure = EXCLUDED.unit_of_measure,
                minimum_units = EXCLUDED.minimum_units,
                maximum_units = EXCLUDED.maximum_units,
                valid_from = EXCLUDED.valid_from,
                valid_to = EXCLUDED.valid_to,
                season_type = EXCLUDED.season_type,
                day_of_week_rates = EXCLUDED.day_of_week_rates,
                group_size_rates = EXCLUDED.group_size_rates,
                early_bird_discount = EXCLUDED.early_bird_discount,
                last_minute_rate = EXCLUDED.last_minute_rate,
                cancellation_charges = EXCLUDED.cancellation_charges,
                version = EXCLUDED.version,
                is_active = EXCLUDED.is_active,
                notes = EXCLUDED.notes,
                metadata = EXCLUDED.metadata,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [
                props.id,
                props.tenantId,
                props.vendorId,
                props.contractId,
                props.serviceType,
                props.serviceCode,
                props.rateName,
                props.rateType,
                props.baseRate,
                props.currency,
                props.unitOfMeasure,
                props.minimumUnits,
                props.maximumUnits,
                props.validFrom,
                props.validTo,
                props.seasonType,
                JSON.stringify(props.dayOfWeekRates),
                JSON.stringify(props.groupSizeRates),
                JSON.stringify(props.earlyBirdDiscount),
                JSON.stringify(props.lastMinuteRate),
                JSON.stringify(props.cancellationCharges),
                props.version,
                props.isActive,
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
        await this.pool.query(`DELETE FROM vendor_rates WHERE id = $1`, [id]);
    }

    async deactivate(id: string): Promise<void> {
        await this.pool.query(
            `UPDATE vendor_rates SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [id]
        );
    }

    private mapToEntity(row: any): VendorRate {
        return VendorRate.create({
            id: row.id,
            tenantId: row.tenant_id,
            vendorId: row.vendor_id,
            contractId: row.contract_id,
            serviceType: row.service_type,
            serviceCode: row.service_code,
            rateName: row.rate_name,
            rateType: row.rate_type,
            baseRate: parseFloat(row.base_rate),
            currency: row.currency,
            unitOfMeasure: row.unit_of_measure,
            minimumUnits: row.minimum_units,
            maximumUnits: row.maximum_units,
            validFrom: row.valid_from,
            validTo: row.valid_to,
            seasonType: row.season_type,
            dayOfWeekRates: row.day_of_week_rates,
            groupSizeRates: row.group_size_rates,
            earlyBirdDiscount: row.early_bird_discount,
            lastMinuteRate: row.last_minute_rate,
            cancellationCharges: row.cancellation_charges,
            version: row.version,
            isActive: row.is_active,
            notes: row.notes,
            metadata: row.metadata,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}
