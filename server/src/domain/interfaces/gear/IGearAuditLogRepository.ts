import { GearAuditLog, GearAuditAction } from '../../entities/gear/GearAuditLog.js';

export interface GearAuditLogFilters {
    gearItemId?: string;
    action?: GearAuditAction | GearAuditAction[];
    entityType?: string;
    entityId?: string;
    performedByUserId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface IGearAuditLogRepository {
    findAll(
        tenantId: string,
        filters?: GearAuditLogFilters,
        limit?: number,
        offset?: number
    ): Promise<GearAuditLog[]>;
    findByGearItem(
        gearItemId: string,
        tenantId: string,
        limit?: number
    ): Promise<GearAuditLog[]>;
    save(log: GearAuditLog): Promise<GearAuditLog>;
    saveMany(logs: GearAuditLog[]): Promise<void>;
    count(tenantId: string, filters?: GearAuditLogFilters): Promise<number>;
}
