import { generateId } from '../../../shared/utils/index.js';

/**
 * Maintenance type
 */
export type MaintenanceType = 
    | 'INSPECTION'      // Regular inspection
    | 'CLEANING'        // Cleaning and sanitization
    | 'REPAIR'          // Repair work
    | 'REPLACEMENT_PART' // Part replacement
    | 'CALIBRATION'     // Equipment calibration
    | 'CERTIFICATION'   // Safety certification
    | 'RECALL'          // Manufacturer recall
    | 'UPGRADE';        // Feature upgrade

/**
 * Maintenance priority
 */
export type MaintenancePriority = 
    | 'LOW'             // Can be scheduled
    | 'MEDIUM'          // Within 2 weeks
    | 'HIGH'            // Within 1 week
    | 'CRITICAL';       // Immediate

/**
 * Maintenance status
 */
export type MaintenanceStatus = 
    | 'SCHEDULED'       // Planned maintenance
    | 'IN_PROGRESS'     // Currently being done
    | 'PENDING_PARTS'   // Waiting for parts
    | 'COMPLETED'       // Done
    | 'FAILED'          // Maintenance failed
    | 'CANCELLED';      // Cancelled

export interface GearMaintenanceProps {
    id?: string;
    tenantId: string;
    gearItemId: string;
    damageReportId?: string;
    maintenanceType: MaintenanceType;
    priority: MaintenancePriority;
    status: MaintenanceStatus;
    title: string;
    description?: string;
    scheduledDate?: Date;
    startedAt?: Date;
    completedAt?: Date;
    assignedToUserId?: string;
    vendorId?: string;
    estimatedCost?: number;
    actualCost?: number;
    laborCost?: number;
    partsCost?: number;
    currency?: string;
    partsUsed?: Record<string, unknown>[];
    workPerformed?: string;
    conditionBefore?: string;
    conditionAfter?: string;
    conditionScoreBefore?: number;
    conditionScoreAfter?: number;
    nextMaintenanceDue?: Date;
    nextInspectionDue?: Date;
    photos?: string[];
    documents?: string[];
    notes?: string;
    createdByUserId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * GearMaintenance entity - tracks maintenance and repair activities.
 */
export class GearMaintenance {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly gearItemId: string;
    public readonly damageReportId?: string;
    public readonly maintenanceType: MaintenanceType;
    public readonly priority: MaintenancePriority;
    public readonly status: MaintenanceStatus;
    public readonly title: string;
    public readonly description: string;
    public readonly scheduledDate?: Date;
    public readonly startedAt?: Date;
    public readonly completedAt?: Date;
    public readonly assignedToUserId?: string;
    public readonly vendorId?: string;
    public readonly estimatedCost: number;
    public readonly actualCost: number;
    public readonly laborCost: number;
    public readonly partsCost: number;
    public readonly currency: string;
    public readonly partsUsed: Record<string, unknown>[];
    public readonly workPerformed: string;
    public readonly conditionBefore: string;
    public readonly conditionAfter: string;
    public readonly conditionScoreBefore: number;
    public readonly conditionScoreAfter: number;
    public readonly nextMaintenanceDue?: Date;
    public readonly nextInspectionDue?: Date;
    public readonly photos: string[];
    public readonly documents: string[];
    public readonly notes: string;
    public readonly createdByUserId?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: GearMaintenanceProps) {
        Object.assign(this, props);
    }

    static create(props: GearMaintenanceProps): GearMaintenance {
        return new GearMaintenance({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            gearItemId: props.gearItemId,
            damageReportId: props.damageReportId,
            maintenanceType: props.maintenanceType,
            priority: props.priority,
            status: props.status ?? 'SCHEDULED',
            title: props.title,
            description: props.description ?? '',
            scheduledDate: props.scheduledDate,
            startedAt: props.startedAt,
            completedAt: props.completedAt,
            assignedToUserId: props.assignedToUserId,
            vendorId: props.vendorId,
            estimatedCost: props.estimatedCost ?? 0,
            actualCost: props.actualCost ?? 0,
            laborCost: props.laborCost ?? 0,
            partsCost: props.partsCost ?? 0,
            currency: props.currency ?? 'INR',
            partsUsed: props.partsUsed ?? [],
            workPerformed: props.workPerformed ?? '',
            conditionBefore: props.conditionBefore ?? '',
            conditionAfter: props.conditionAfter ?? '',
            conditionScoreBefore: props.conditionScoreBefore ?? 0,
            conditionScoreAfter: props.conditionScoreAfter ?? 0,
            nextMaintenanceDue: props.nextMaintenanceDue,
            nextInspectionDue: props.nextInspectionDue,
            photos: props.photos ?? [],
            documents: props.documents ?? [],
            notes: props.notes ?? '',
            createdByUserId: props.createdByUserId,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: GearMaintenanceProps): GearMaintenance {
        return GearMaintenance.create(data);
    }

    /**
     * Get total cost
     */
    getTotalCost(): number {
        return this.actualCost || (this.laborCost + this.partsCost);
    }

    /**
     * Check if overdue
     */
    isOverdue(): boolean {
        if (this.status === 'COMPLETED' || this.status === 'CANCELLED') return false;
        if (!this.scheduledDate) return false;
        return new Date() > this.scheduledDate;
    }
}
