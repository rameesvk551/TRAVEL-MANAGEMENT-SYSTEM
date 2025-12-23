import { 
    GearMaintenance, 
    MaintenanceStatus, 
    MaintenanceType, 
    MaintenancePriority 
} from '../../entities/gear/GearMaintenance.js';

export interface GearMaintenanceFilters {
    gearItemId?: string;
    maintenanceType?: MaintenanceType | MaintenanceType[];
    priority?: MaintenancePriority | MaintenancePriority[];
    status?: MaintenanceStatus | MaintenanceStatus[];
    assignedToUserId?: string;
    vendorId?: string;
    scheduledFrom?: Date;
    scheduledTo?: Date;
    isOverdue?: boolean;
}

export interface IGearMaintenanceRepository {
    findById(id: string, tenantId: string): Promise<GearMaintenance | null>;
    findAll(
        tenantId: string,
        filters?: GearMaintenanceFilters,
        limit?: number,
        offset?: number
    ): Promise<GearMaintenance[]>;
    findByGearItem(gearItemId: string, tenantId: string): Promise<GearMaintenance[]>;
    findScheduled(tenantId: string, startDate: Date, endDate: Date): Promise<GearMaintenance[]>;
    findOverdue(tenantId: string): Promise<GearMaintenance[]>;
    findPending(tenantId: string): Promise<GearMaintenance[]>;
    count(tenantId: string, filters?: GearMaintenanceFilters): Promise<number>;
    save(maintenance: GearMaintenance): Promise<GearMaintenance>;
    update(maintenance: GearMaintenance): Promise<GearMaintenance>;
    updateStatus(
        id: string,
        tenantId: string,
        status: MaintenanceStatus
    ): Promise<void>;
    complete(
        id: string,
        tenantId: string,
        workPerformed: string,
        actualCost: number,
        conditionAfter: string,
        conditionScoreAfter: number,
        nextMaintenanceDue?: Date,
        nextInspectionDue?: Date
    ): Promise<GearMaintenance>;
    calculateMaintenanceCosts(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalCost: number;
        laborCost: number;
        partsCost: number;
        byType: Record<MaintenanceType, number>;
        completedCount: number;
        pendingCount: number;
    }>;
}
