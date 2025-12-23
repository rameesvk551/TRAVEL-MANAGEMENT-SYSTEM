import { generateId } from '../../../shared/utils/index.js';

export type AssignmentStatus =
    | 'REQUESTED'
    | 'ASSIGNED'
    | 'ACCEPTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'PARTIALLY_COMPLETED'
    | 'CANCELLED'
    | 'DISPUTED'
    | 'REPLACED';

export interface RateSnapshot {
    rateId: string;
    rateName: string;
    rateType: string;
    baseRate: number;
    currency: string;
}

export interface VendorAssignmentProps {
    id?: string;
    tenantId: string;
    vendorId: string;
    bookingId?: string;
    resourceId?: string;
    departureId?: string;
    assignmentType?: string;
    serviceDescription?: string;
    serviceStartDate: Date;
    serviceEndDate: Date;
    rateId?: string;
    rateSnapshot?: RateSnapshot;
    quantity?: number;
    unitType?: string;
    grossAmount: number;
    discountAmount?: number;
    netAmount: number;
    currency?: string;
    status?: AssignmentStatus;
    acceptedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    replacedById?: string;
    replacesId?: string;
    fulfilmentPercentage?: number;
    fulfilmentNotes?: string;
    customerRating?: number;
    customerFeedback?: string;
    internalNotes?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * VendorAssignment entity - links vendors to bookings/trips.
 * Tracks fulfilment and supports partial completion.
 */
export class VendorAssignment {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly vendorId: string;
    public readonly bookingId?: string;
    public readonly resourceId?: string;
    public readonly departureId?: string;
    public readonly assignmentType?: string;
    public readonly serviceDescription?: string;
    public readonly serviceStartDate: Date;
    public readonly serviceEndDate: Date;
    public readonly rateId?: string;
    public readonly rateSnapshot?: RateSnapshot;
    public readonly quantity: number;
    public readonly unitType?: string;
    public readonly grossAmount: number;
    public readonly discountAmount: number;
    public readonly netAmount: number;
    public readonly currency: string;
    public readonly status: AssignmentStatus;
    public readonly acceptedAt?: Date;
    public readonly completedAt?: Date;
    public readonly cancelledAt?: Date;
    public readonly cancellationReason?: string;
    public readonly replacedById?: string;
    public readonly replacesId?: string;
    public readonly fulfilmentPercentage: number;
    public readonly fulfilmentNotes?: string;
    public readonly customerRating?: number;
    public readonly customerFeedback?: string;
    public readonly internalNotes?: string;
    public readonly createdBy?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: VendorAssignmentProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.vendorId = props.vendorId;
        this.bookingId = props.bookingId;
        this.resourceId = props.resourceId;
        this.departureId = props.departureId;
        this.assignmentType = props.assignmentType;
        this.serviceDescription = props.serviceDescription;
        this.serviceStartDate = props.serviceStartDate;
        this.serviceEndDate = props.serviceEndDate;
        this.rateId = props.rateId;
        this.rateSnapshot = props.rateSnapshot;
        this.quantity = props.quantity ?? 1;
        this.unitType = props.unitType;
        this.grossAmount = props.grossAmount;
        this.discountAmount = props.discountAmount ?? 0;
        this.netAmount = props.netAmount;
        this.currency = props.currency ?? 'INR';
        this.status = props.status ?? 'REQUESTED';
        this.acceptedAt = props.acceptedAt;
        this.completedAt = props.completedAt;
        this.cancelledAt = props.cancelledAt;
        this.cancellationReason = props.cancellationReason;
        this.replacedById = props.replacedById;
        this.replacesId = props.replacesId;
        this.fulfilmentPercentage = props.fulfilmentPercentage ?? 0;
        this.fulfilmentNotes = props.fulfilmentNotes;
        this.customerRating = props.customerRating;
        this.customerFeedback = props.customerFeedback;
        this.internalNotes = props.internalNotes;
        this.createdBy = props.createdBy;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: VendorAssignmentProps): VendorAssignment {
        return new VendorAssignment({
            ...props,
            id: props.id ?? generateId(),
        });
    }

    static fromPersistence(data: VendorAssignmentProps & { id: string }): VendorAssignment {
        return new VendorAssignment(data);
    }
}
