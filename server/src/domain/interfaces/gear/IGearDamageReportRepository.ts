import { 
    GearDamageReport, 
    DamageReportStatus, 
    DamageSeverity, 
    DamageResponsibility 
} from '../../entities/gear/GearDamageReport.js';

export interface GearDamageReportFilters {
    gearItemId?: string;
    tripId?: string;
    assignmentId?: string;
    rentalId?: string;
    severity?: DamageSeverity | DamageSeverity[];
    responsibility?: DamageResponsibility | DamageResponsibility[];
    status?: DamageReportStatus | DamageReportStatus[];
    reportedByUserId?: string;
    isOpen?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface IGearDamageReportRepository {
    findById(id: string, tenantId: string): Promise<GearDamageReport | null>;
    findAll(
        tenantId: string,
        filters?: GearDamageReportFilters,
        limit?: number,
        offset?: number
    ): Promise<GearDamageReport[]>;
    findByGearItem(gearItemId: string, tenantId: string): Promise<GearDamageReport[]>;
    findByTrip(tripId: string, tenantId: string): Promise<GearDamageReport[]>;
    findOpen(tenantId: string): Promise<GearDamageReport[]>;
    count(tenantId: string, filters?: GearDamageReportFilters): Promise<number>;
    save(report: GearDamageReport): Promise<GearDamageReport>;
    update(report: GearDamageReport): Promise<GearDamageReport>;
    updateStatus(
        id: string,
        tenantId: string,
        status: DamageReportStatus
    ): Promise<void>;
    calculateLossSummary(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalReports: number;
        bySeverity: Record<DamageSeverity, number>;
        byResponsibility: Record<DamageResponsibility, number>;
        totalRepairCost: number;
        totalReplacementCost: number;
        insuranceRecovered: number;
        customerCharged: number;
        netLoss: number;
    }>;
}
