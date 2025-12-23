import { generateId } from '../../../shared/utils/index.js';

/**
 * Damage severity levels
 */
export type DamageSeverity = 
    | 'MINOR'           // Cosmetic, no functional impact
    | 'MODERATE'        // Functional impact, repairable
    | 'MAJOR'           // Significant damage, expensive repair
    | 'TOTAL_LOSS';     // Beyond repair / lost

/**
 * Responsibility for damage
 */
export type DamageResponsibility = 
    | 'NORMAL_WEAR'     // Expected wear and tear
    | 'CUSTOMER'        // Customer negligence/misuse
    | 'STAFF'           // Staff negligence
    | 'VENDOR'          // Vendor/supplier issue
    | 'FORCE_MAJEURE'   // Act of nature
    | 'MANUFACTURING'   // Manufacturing defect
    | 'UNKNOWN'         // Cannot determine
    | 'THEFT';          // Stolen

/**
 * Damage report status
 */
export type DamageReportStatus = 
    | 'REPORTED'        // Initial report
    | 'UNDER_REVIEW'    // Being assessed
    | 'ASSESSED'        // Assessment complete
    | 'REPAIR_SCHEDULED'// Repair planned
    | 'IN_REPAIR'       // Currently being repaired
    | 'REPAIRED'        // Repair complete
    | 'WRITTEN_OFF'     // Permanently retired
    | 'INSURANCE_CLAIM' // Insurance claim filed
    | 'RESOLVED'        // Case closed
    | 'DISPUTED';       // Responsibility disputed

export interface GearDamageReportProps {
    id?: string;
    tenantId: string;
    gearItemId: string;
    tripId?: string;
    assignmentId?: string;
    rentalId?: string;
    reportedByUserId: string;
    reportedAt?: Date;
    incidentDate?: Date;
    incidentLocation?: string;
    severity: DamageSeverity;
    responsibility: DamageResponsibility;
    status: DamageReportStatus;
    description: string;
    damageDetails?: Record<string, unknown>;
    photos?: string[];
    videos?: string[];
    assessedByUserId?: string;
    assessedAt?: Date;
    assessmentNotes?: string;
    estimatedRepairCost?: number;
    actualRepairCost?: number;
    replacementCost?: number;
    insuranceCovered?: boolean;
    insuranceClaimId?: string;
    insuranceAmount?: number;
    chargedToCustomer?: boolean;
    customerChargeAmount?: number;
    repairVendorId?: string;
    repairStartDate?: Date;
    repairEndDate?: Date;
    repairNotes?: string;
    resolutionNotes?: string;
    resolvedByUserId?: string;
    resolvedAt?: Date;
    currency?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * GearDamageReport entity - tracks damage and loss incidents.
 * Supports full incident lifecycle with cost tracking.
 */
export class GearDamageReport {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly gearItemId: string;
    public readonly tripId?: string;
    public readonly assignmentId?: string;
    public readonly rentalId?: string;
    public readonly reportedByUserId: string;
    public readonly reportedAt: Date;
    public readonly incidentDate?: Date;
    public readonly incidentLocation?: string;
    public readonly severity: DamageSeverity;
    public readonly responsibility: DamageResponsibility;
    public readonly status: DamageReportStatus;
    public readonly description: string;
    public readonly damageDetails: Record<string, unknown>;
    public readonly photos: string[];
    public readonly videos: string[];
    public readonly assessedByUserId?: string;
    public readonly assessedAt?: Date;
    public readonly assessmentNotes: string;
    public readonly estimatedRepairCost: number;
    public readonly actualRepairCost: number;
    public readonly replacementCost: number;
    public readonly insuranceCovered: boolean;
    public readonly insuranceClaimId?: string;
    public readonly insuranceAmount: number;
    public readonly chargedToCustomer: boolean;
    public readonly customerChargeAmount: number;
    public readonly repairVendorId?: string;
    public readonly repairStartDate?: Date;
    public readonly repairEndDate?: Date;
    public readonly repairNotes: string;
    public readonly resolutionNotes: string;
    public readonly resolvedByUserId?: string;
    public readonly resolvedAt?: Date;
    public readonly currency: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: GearDamageReportProps) {
        Object.assign(this, props);
    }

    static create(props: GearDamageReportProps): GearDamageReport {
        return new GearDamageReport({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            gearItemId: props.gearItemId,
            tripId: props.tripId,
            assignmentId: props.assignmentId,
            rentalId: props.rentalId,
            reportedByUserId: props.reportedByUserId,
            reportedAt: props.reportedAt ?? new Date(),
            incidentDate: props.incidentDate,
            incidentLocation: props.incidentLocation,
            severity: props.severity,
            responsibility: props.responsibility,
            status: props.status ?? 'REPORTED',
            description: props.description,
            damageDetails: props.damageDetails ?? {},
            photos: props.photos ?? [],
            videos: props.videos ?? [],
            assessedByUserId: props.assessedByUserId,
            assessedAt: props.assessedAt,
            assessmentNotes: props.assessmentNotes ?? '',
            estimatedRepairCost: props.estimatedRepairCost ?? 0,
            actualRepairCost: props.actualRepairCost ?? 0,
            replacementCost: props.replacementCost ?? 0,
            insuranceCovered: props.insuranceCovered ?? false,
            insuranceClaimId: props.insuranceClaimId,
            insuranceAmount: props.insuranceAmount ?? 0,
            chargedToCustomer: props.chargedToCustomer ?? false,
            customerChargeAmount: props.customerChargeAmount ?? 0,
            repairVendorId: props.repairVendorId,
            repairStartDate: props.repairStartDate,
            repairEndDate: props.repairEndDate,
            repairNotes: props.repairNotes ?? '',
            resolutionNotes: props.resolutionNotes ?? '',
            resolvedByUserId: props.resolvedByUserId,
            resolvedAt: props.resolvedAt,
            currency: props.currency ?? 'INR',
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: GearDamageReportProps): GearDamageReport {
        return GearDamageReport.create(data);
    }

    /**
     * Get total financial impact
     */
    getTotalCost(): number {
        return this.actualRepairCost || this.replacementCost;
    }

    /**
     * Get net cost after insurance
     */
    getNetCost(): number {
        return this.getTotalCost() - this.insuranceAmount - this.customerChargeAmount;
    }

    /**
     * Check if case is open
     */
    isOpen(): boolean {
        return !['RESOLVED', 'REPAIRED', 'WRITTEN_OFF'].includes(this.status);
    }
}
