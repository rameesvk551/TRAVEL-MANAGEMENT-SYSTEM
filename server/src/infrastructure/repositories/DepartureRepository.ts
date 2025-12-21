import { query as dbQuery, getClient } from '../database/index.js';
import {
    DepartureInstance,
    DepartureInstanceProps,
    DepartureStatus,
} from '../../domain/entities/index.js';
import {
    IDepartureRepository,
    InventoryState,
    DepartureFilter,
    HoldResult,
} from '../../domain/interfaces/index.js';

interface DbRow {
    [key: string]: unknown;
}

/**
 * DepartureRepository - PostgreSQL implementation
 * 
 * Uses row-level locking (SELECT FOR UPDATE) for atomic inventory operations
 */
export class DepartureRepository implements IDepartureRepository {
    async findById(id: string, tenantId: string): Promise<DepartureInstance | null> {
        const result = await dbQuery(
            `SELECT * FROM departure_instances WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );

        if (result.rows.length === 0) return null;
        return this.mapToDomain(result.rows[0] as DbRow);
    }

    async findByResource(
        resourceId: string,
        tenantId: string,
        filter?: DepartureFilter
    ): Promise<DepartureInstance[]> {
        let sql = `
            SELECT * FROM departure_instances 
            WHERE resource_id = $1 AND tenant_id = $2
        `;
        const params: unknown[] = [resourceId, tenantId];
        let paramIndex = 3;

        if (filter?.dateFrom) {
            sql += ` AND departure_date >= $${paramIndex}`;
            params.push(filter.dateFrom);
            paramIndex++;
        }

        if (filter?.dateTo) {
            sql += ` AND departure_date <= $${paramIndex}`;
            params.push(filter.dateTo);
            paramIndex++;
        }

        if (filter?.status) {
            const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
            sql += ` AND status = ANY($${paramIndex})`;
            params.push(statuses);
            paramIndex++;
        }

        sql += ` ORDER BY departure_date ASC`;

        const result = await dbQuery(sql, params);
        return result.rows.map((row) => this.mapToDomain(row as DbRow));
    }

    async findByDateRange(
        tenantId: string,
        dateFrom: Date,
        dateTo: Date,
        filter?: DepartureFilter
    ): Promise<DepartureInstance[]> {
        let sql = `
            SELECT * FROM departure_instances 
            WHERE tenant_id = $1 
            AND departure_date >= $2 
            AND departure_date <= $3
        `;
        const params: unknown[] = [tenantId, dateFrom, dateTo];
        let paramIndex = 4;

        if (filter?.resourceId) {
            sql += ` AND resource_id = $${paramIndex}`;
            params.push(filter.resourceId);
            paramIndex++;
        }

        if (filter?.status) {
            const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
            sql += ` AND status = ANY($${paramIndex})`;
            params.push(statuses);
        }

        sql += ` ORDER BY departure_date ASC, resource_id ASC`;

        const result = await dbQuery(sql, params);
        return result.rows.map((row) => this.mapToDomain(row as DbRow));
    }

    async getInventoryState(departureId: string): Promise<InventoryState | null> {
        const result = await dbQuery(
            `SELECT * FROM departure_inventory_view WHERE id = $1`,
            [departureId]
        );

        if (result.rows.length === 0) return null;

        const row = result.rows[0] as DbRow;
        return {
            departureId: row.id as string,
            totalCapacity: row.total_capacity as number,
            blockedSeats: row.blocked_seats as number,
            sellableCapacity: row.sellable_capacity as number,
            heldSeats: row.held_seats as number,
            confirmedSeats: row.confirmed_seats as number,
            availableSeats: row.available_seats as number,
            bookableSeats: row.bookable_seats as number,
            waitlistCount: row.waitlist_count as number,
            websiteBookings: row.website_bookings as number,
            otaBookings: row.ota_bookings as number,
            manualBookings: row.manual_bookings as number,
        };
    }

    async getInventoryStates(departureIds: string[]): Promise<InventoryState[]> {
        if (departureIds.length === 0) return [];

        const result = await dbQuery(
            `SELECT * FROM departure_inventory_view WHERE id = ANY($1)`,
            [departureIds]
        );

        return result.rows.map((row) => {
            const r = row as DbRow;
            return {
                departureId: r.id as string,
                totalCapacity: r.total_capacity as number,
                blockedSeats: r.blocked_seats as number,
                sellableCapacity: r.sellable_capacity as number,
                heldSeats: r.held_seats as number,
                confirmedSeats: r.confirmed_seats as number,
                availableSeats: r.available_seats as number,
                bookableSeats: r.bookable_seats as number,
                waitlistCount: r.waitlist_count as number,
                websiteBookings: r.website_bookings as number,
                otaBookings: r.ota_bookings as number,
                manualBookings: r.manual_bookings as number,
            };
        });
    }

    async save(departure: DepartureInstance): Promise<DepartureInstance> {
        const result = await dbQuery(
            `INSERT INTO departure_instances (
                id, tenant_id, resource_id, departure_date, departure_time,
                end_date, cutoff_datetime, total_capacity, blocked_seats,
                overbooking_limit, min_participants, status, is_guaranteed,
                price_override, currency, attributes, version
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (tenant_id, resource_id, departure_date) 
            DO UPDATE SET
                departure_time = EXCLUDED.departure_time,
                end_date = EXCLUDED.end_date,
                cutoff_datetime = EXCLUDED.cutoff_datetime,
                total_capacity = EXCLUDED.total_capacity,
                blocked_seats = EXCLUDED.blocked_seats,
                overbooking_limit = EXCLUDED.overbooking_limit,
                min_participants = EXCLUDED.min_participants,
                status = EXCLUDED.status,
                is_guaranteed = EXCLUDED.is_guaranteed,
                price_override = EXCLUDED.price_override,
                currency = EXCLUDED.currency,
                attributes = EXCLUDED.attributes,
                version = departure_instances.version + 1,
                updated_at = NOW()
            RETURNING *`,
            [
                departure.id,
                departure.tenantId,
                departure.resourceId,
                departure.departureDate,
                departure.departureTime,
                departure.endDate,
                departure.cutoffDatetime,
                departure.totalCapacity,
                departure.blockedSeats,
                departure.overbookingLimit,
                departure.minParticipants,
                departure.status,
                departure.isGuaranteed,
                departure.priceOverride,
                departure.currency,
                JSON.stringify(departure.attributes),
                departure.version,
            ]
        );

        return this.mapToDomain(result.rows[0] as DbRow);
    }

    async updateStatus(
        id: string,
        status: DepartureStatus,
        tenantId: string
    ): Promise<boolean> {
        const result = await dbQuery(
            `UPDATE departure_instances 
             SET status = $1, version = version + 1, updated_at = NOW()
             WHERE id = $2 AND tenant_id = $3`,
            [status, id, tenantId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Atomic hold creation using stored procedure
     */
    async createHold(params: {
        tenantId: string;
        departureId: string;
        seatCount: number;
        source: string;
        sourcePlatform?: string;
        holdType: string;
        ttlMinutes: number;
        createdById?: string;
        sessionId?: string;
    }): Promise<HoldResult> {
        const result = await dbQuery(
            `SELECT * FROM create_inventory_hold($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                params.tenantId,
                params.departureId,
                params.seatCount,
                params.source,
                params.sourcePlatform ?? null,
                params.holdType,
                params.ttlMinutes,
                params.createdById ?? null,
                params.sessionId ?? null,
            ]
        );

        const row = result.rows[0] as DbRow;
        return {
            success: row.success as boolean,
            holdId: (row.hold_id as string) ?? undefined,
            errorCode: (row.error_code as string) ?? undefined,
            errorMessage: (row.error_message as string) ?? undefined,
        };
    }

    async releaseHold(
        holdId: string,
        reason: string,
        actorId?: string
    ): Promise<boolean> {
        const result = await dbQuery(
            `SELECT release_inventory_hold($1, $2, $3) as released`,
            [holdId, reason, actorId ?? null]
        );
        return (result.rows[0] as DbRow)?.released as boolean ?? false;
    }

    async extendHold(holdId: string, additionalMinutes: number): Promise<boolean> {
        const result = await dbQuery(
            `UPDATE inventory_holds 
             SET expires_at = NOW() + ($2 || ' minutes')::INTERVAL
             WHERE id = $1 AND released_at IS NULL AND expires_at > NOW()`,
            [holdId, additionalMinutes]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async getActiveHolds(departureId: string): Promise<{
        id: string;
        seatCount: number;
        source: string;
        holdType: string;
        expiresAt: Date;
        createdById?: string;
        sessionId?: string;
    }[]> {
        const result = await dbQuery(
            `SELECT id, seat_count, source, hold_type, expires_at, created_by_id, session_id
             FROM inventory_holds 
             WHERE departure_id = $1 AND released_at IS NULL AND expires_at > NOW()
             ORDER BY created_at ASC`,
            [departureId]
        );

        return result.rows.map((row) => {
            const r = row as DbRow;
            return {
                id: r.id as string,
                seatCount: r.seat_count as number,
                source: r.source as string,
                holdType: r.hold_type as string,
                expiresAt: r.expires_at as Date,
                createdById: r.created_by_id as string | undefined,
                sessionId: r.session_id as string | undefined,
            };
        });
    }

    async expireStaleHolds(): Promise<number> {
        const result = await dbQuery(`SELECT expire_stale_holds() as count`);
        return (result.rows[0] as DbRow)?.count as number ?? 0;
    }

    private mapToDomain(row: DbRow): DepartureInstance {
        return DepartureInstance.fromPersistence({
            id: row.id as string,
            tenantId: row.tenant_id as string,
            resourceId: row.resource_id as string,
            departureDate: new Date(row.departure_date as string),
            departureTime: row.departure_time as string | undefined,
            endDate: row.end_date ? new Date(row.end_date as string) : undefined,
            cutoffDatetime: row.cutoff_datetime 
                ? new Date(row.cutoff_datetime as string) 
                : undefined,
            totalCapacity: row.total_capacity as number,
            blockedSeats: row.blocked_seats as number,
            overbookingLimit: row.overbooking_limit as number,
            minParticipants: row.min_participants as number,
            status: row.status as DepartureStatus,
            isGuaranteed: row.is_guaranteed as boolean,
            priceOverride: row.price_override as number | undefined,
            currency: row.currency as string,
            attributes: (row.attributes as Record<string, unknown>) ?? {},
            version: row.version as number,
            createdAt: new Date(row.created_at as string),
            updatedAt: new Date(row.updated_at as string),
        });
    }
}
