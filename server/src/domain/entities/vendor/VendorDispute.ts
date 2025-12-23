import { generateId } from '../../../shared/utils/index.js';

export type DisputeStatus =
    | 'OPEN'
    | 'UNDER_REVIEW'
    | 'RESOLVED_VENDOR_FAVOR'
    | 'RESOLVED_TENANT_FAVOR'
    | 'RESOLVED_COMPROMISE'
    | 'CLOSED';

export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VendorDisputeProps {
    id?: string;
    tenantId: string;
    vendorId: string;
    assignmentId?: string;
    payableId?: string;
    disputeNumber?: string;
    subject: string;
    description: string;
    disputeType?: string;
    disputedAmount?: number;
    resolvedAmount?: number;
    evidenceUrls?: string[];
    status?: DisputeStatus;
    priority?: DisputePriority;
    resolutionNotes?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
    adjustmentAmount?: number;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * VendorDispute entity - handles disagreements and adjustments.
 * No deletion - only resolutions and reversals.
 */
export class VendorDispute {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly vendorId: string;
    public readonly assignmentId?: string;
    public readonly payableId?: string;
    public readonly disputeNumber?: string;
    public readonly subject: string;
    public readonly description: string;
    public readonly disputeType?: string;
    public readonly disputedAmount?: number;
    public readonly resolvedAmount?: number;
    public readonly evidenceUrls: string[];
    public readonly status: DisputeStatus;
    public readonly priority: DisputePriority;
    public readonly resolutionNotes?: string;
    public readonly resolvedAt?: Date;
    public readonly resolvedBy?: string;
    public readonly adjustmentAmount: number;
    public readonly createdBy?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: VendorDisputeProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.vendorId = props.vendorId;
        this.assignmentId = props.assignmentId;
        this.payableId = props.payableId;
        this.disputeNumber = props.disputeNumber;
        this.subject = props.subject;
        this.description = props.description;
        this.disputeType = props.disputeType;
        this.disputedAmount = props.disputedAmount;
        this.resolvedAmount = props.resolvedAmount;
        this.evidenceUrls = props.evidenceUrls ?? [];
        this.status = props.status ?? 'OPEN';
        this.priority = props.priority ?? 'MEDIUM';
        this.resolutionNotes = props.resolutionNotes;
        this.resolvedAt = props.resolvedAt;
        this.resolvedBy = props.resolvedBy;
        this.adjustmentAmount = props.adjustmentAmount ?? 0;
        this.createdBy = props.createdBy;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: VendorDisputeProps): VendorDispute {
        return new VendorDispute({
            ...props,
            id: props.id ?? generateId(),
        });
    }

    static fromPersistence(data: VendorDisputeProps & { id: string }): VendorDispute {
        return new VendorDispute(data);
    }

    get isResolved(): boolean {
        return ['RESOLVED_VENDOR_FAVOR', 'RESOLVED_TENANT_FAVOR', 'RESOLVED_COMPROMISE', 'CLOSED']
            .includes(this.status);
    }
}
