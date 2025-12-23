import { generateId } from '../../../shared/utils/index.js';

export type SettlementMethod = 
    | 'BANK_TRANSFER'
    | 'UPI'
    | 'CASH'
    | 'CHEQUE'
    | 'ADJUSTMENT';

export interface BankDetailsSnapshot {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
}

export interface VendorSettlementProps {
    id?: string;
    tenantId: string;
    vendorId: string;
    settlementNumber?: string;
    payableIds?: string[];
    amount: number;
    currency?: string;
    paymentMethod: SettlementMethod;
    paymentReference?: string;
    paymentDate: Date;
    bankDetailsSnapshot?: BankDetailsSnapshot;
    isVerified?: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;
    notes?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * VendorSettlement entity - represents payments made to vendors.
 * Can settle multiple payables at once.
 */
export class VendorSettlement {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly vendorId: string;
    public readonly settlementNumber?: string;
    public readonly payableIds: string[];
    public readonly amount: number;
    public readonly currency: string;
    public readonly paymentMethod: SettlementMethod;
    public readonly paymentReference?: string;
    public readonly paymentDate: Date;
    public readonly bankDetailsSnapshot: BankDetailsSnapshot;
    public readonly isVerified: boolean;
    public readonly verifiedAt?: Date;
    public readonly verifiedBy?: string;
    public readonly notes?: string;
    public readonly createdBy?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: VendorSettlementProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.vendorId = props.vendorId;
        this.settlementNumber = props.settlementNumber;
        this.payableIds = props.payableIds ?? [];
        this.amount = props.amount;
        this.currency = props.currency ?? 'INR';
        this.paymentMethod = props.paymentMethod;
        this.paymentReference = props.paymentReference;
        this.paymentDate = props.paymentDate;
        this.bankDetailsSnapshot = props.bankDetailsSnapshot ?? {};
        this.isVerified = props.isVerified ?? false;
        this.verifiedAt = props.verifiedAt;
        this.verifiedBy = props.verifiedBy;
        this.notes = props.notes;
        this.createdBy = props.createdBy;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: VendorSettlementProps): VendorSettlement {
        return new VendorSettlement({
            ...props,
            id: props.id ?? generateId(),
        });
    }

    static fromPersistence(data: VendorSettlementProps & { id: string }): VendorSettlement {
        return new VendorSettlement(data);
    }
}
