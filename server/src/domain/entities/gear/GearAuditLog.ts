import { generateId } from '../../../shared/utils/index.js';

/**
 * Audit action types
 */
export type GearAuditAction = 
    | 'CREATED'
    | 'UPDATED'
    | 'DELETED'
    | 'STATUS_CHANGED'
    | 'CONDITION_CHANGED'
    | 'LOCATION_CHANGED'
    | 'ASSIGNED'
    | 'ISSUED'
    | 'RETURNED'
    | 'DAMAGED'
    | 'REPAIRED'
    | 'RENTED'
    | 'RENTAL_RETURNED'
    | 'INSPECTED'
    | 'MAINTAINED'
    | 'TRANSFERRED'
    | 'RETIRED'
    | 'REACTIVATED';

export interface GearAuditLogProps {
    id?: string;
    tenantId: string;
    gearItemId: string;
    action: GearAuditAction;
    entityType: string;
    entityId?: string;
    previousValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    changedFields?: string[];
    reason?: string;
    performedByUserId?: string;
    performedByName?: string;
    ipAddress?: string;
    userAgent?: string;
    gpsCoordinates?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
}

/**
 * GearAuditLog entity - immutable audit trail for all gear changes.
 */
export class GearAuditLog {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly gearItemId: string;
    public readonly action: GearAuditAction;
    public readonly entityType: string;
    public readonly entityId?: string;
    public readonly previousValues: Record<string, unknown>;
    public readonly newValues: Record<string, unknown>;
    public readonly changedFields: string[];
    public readonly reason: string;
    public readonly performedByUserId?: string;
    public readonly performedByName: string;
    public readonly ipAddress: string;
    public readonly userAgent: string;
    public readonly gpsCoordinates?: string;
    public readonly metadata: Record<string, unknown>;
    public readonly createdAt: Date;

    private constructor(props: GearAuditLogProps) {
        Object.assign(this, props);
    }

    static create(props: GearAuditLogProps): GearAuditLog {
        return new GearAuditLog({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            gearItemId: props.gearItemId,
            action: props.action,
            entityType: props.entityType,
            entityId: props.entityId,
            previousValues: props.previousValues ?? {},
            newValues: props.newValues ?? {},
            changedFields: props.changedFields ?? [],
            reason: props.reason ?? '',
            performedByUserId: props.performedByUserId,
            performedByName: props.performedByName ?? 'System',
            ipAddress: props.ipAddress ?? '',
            userAgent: props.userAgent ?? '',
            gpsCoordinates: props.gpsCoordinates,
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? new Date(),
        });
    }

    static fromPersistence(data: GearAuditLogProps): GearAuditLog {
        return GearAuditLog.create(data);
    }
}
