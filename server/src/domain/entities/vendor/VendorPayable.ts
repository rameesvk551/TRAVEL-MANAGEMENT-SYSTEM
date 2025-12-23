import { generateId } from '../../../shared/utils/index.js';

export type PayableStatus =
    | 'DRAFT'
    | 'PENDING'
    | 'APPROVED'
    | 'PARTIALLY_SETTLED'
    | 'FULLY_SETTLED'
    | 'ON_HOLD'
    | 'DISPUTED'
    | 'CANCELLED';

export interface DeductionDetail {
    reason: string;
    amount: number;
    description?: string;
}

export interface VendorPayableProps {
    id?: string;
    tenantId: string;
    vendorId: string;
    assignmentId?: string;
    payableNumber?: string;
    grossAmount: number;
    advancePaid?: number;
    deductions?: number;
    penalties?: number;
    adjustments?: number;
    taxAmount?: number;
    netPayable: number;
    currency?: string;
    deductionDetails?: DeductionDetail[];
    dueDate?: Date;
    status?: PayableStatus;
    approvedAt?: Date;
    approvedBy?: string;
    amountSettled?: number;
    notes?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * VendorPayable entity - represents amounts owed to vendors.
 * Tracks full lifecycle from draft to settlement.
 */
export class VendorPayable {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly vendorId: string;
    public readonly assignmentId?: string;
    public readonly payableNumber?: string;
    public readonly grossAmount: number;
    public readonly advancePaid: number;
    public readonly deductions: number;
    public readonly penalties: number;
    public readonly adjustments: number;
    public readonly taxAmount: number;
    public readonly netPayable: number;
    public readonly currency: string;
    public readonly deductionDetails: DeductionDetail[];
    public readonly dueDate?: Date;
    public readonly status: PayableStatus;
    public readonly approvedAt?: Date;
    public readonly approvedBy?: string;
    public readonly amountSettled: number;
    public readonly notes?: string;
    public readonly createdBy?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: VendorPayableProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.vendorId = props.vendorId;
        this.assignmentId = props.assignmentId;
        this.payableNumber = props.payableNumber;
        this.grossAmount = props.grossAmount;
        this.advancePaid = props.advancePaid ?? 0;
        this.deductions = props.deductions ?? 0;
        this.penalties = props.penalties ?? 0;
        this.adjustments = props.adjustments ?? 0;
        this.taxAmount = props.taxAmount ?? 0;
        this.netPayable = props.netPayable;
        this.currency = props.currency ?? 'INR';
        this.deductionDetails = props.deductionDetails ?? [];
        this.dueDate = props.dueDate;
        this.status = props.status ?? 'DRAFT';
        this.approvedAt = props.approvedAt;
        this.approvedBy = props.approvedBy;
        this.amountSettled = props.amountSettled ?? 0;
        this.notes = props.notes;
        this.createdBy = props.createdBy;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: VendorPayableProps): VendorPayable {
        return new VendorPayable({
            ...props,
            id: props.id ?? generateId(),
        });
    }

    static fromPersistence(data: VendorPayableProps & { id: string }): VendorPayable {
        return new VendorPayable(data);
    }

    get remainingAmount(): number {
        return this.netPayable - this.amountSettled;
    }

    get isFullySettled(): boolean {
        return this.amountSettled >= this.netPayable;
    }
}
