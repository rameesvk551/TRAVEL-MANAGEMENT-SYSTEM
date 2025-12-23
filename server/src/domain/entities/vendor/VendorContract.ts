import { generateId } from '../../../shared/utils/index.js';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';

export interface AdvanceRules {
    percentage: number;
    daysBefore: number;
}

export interface PenaltyClause {
    type: string;
    condition: string;
    amount?: number;
    percentage?: number;
}

export interface VendorContractProps {
    id?: string;
    tenantId: string;
    vendorId: string;
    contractNumber?: string;
    version?: number;
    startDate: Date;
    endDate: Date;
    servicesCovered?: string[];
    cancellationTerms?: string;
    penaltyClauses?: PenaltyClause[];
    advanceRules?: AdvanceRules;
    settlementCycle?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TRIP_END';
    paymentTermsDays?: number;
    contractDocumentUrl?: string;
    status?: ContractStatus;
    signedAt?: Date;
    signedByVendor?: string;
    signedByTenant?: string;
    previousVersionId?: string;
    notes?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * VendorContract entity - explicit contract terms with vendors.
 * Versioned and non-destructive for audit trail.
 */
export class VendorContract {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly vendorId: string;
    public readonly contractNumber?: string;
    public readonly version: number;
    public readonly startDate: Date;
    public readonly endDate: Date;
    public readonly servicesCovered: string[];
    public readonly cancellationTerms?: string;
    public readonly penaltyClauses: PenaltyClause[];
    public readonly advanceRules?: AdvanceRules;
    public readonly settlementCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TRIP_END';
    public readonly paymentTermsDays: number;
    public readonly contractDocumentUrl?: string;
    public readonly status: ContractStatus;
    public readonly signedAt?: Date;
    public readonly signedByVendor?: string;
    public readonly signedByTenant?: string;
    public readonly previousVersionId?: string;
    public readonly notes?: string;
    public readonly createdBy?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: VendorContractProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.vendorId = props.vendorId;
        this.contractNumber = props.contractNumber;
        this.version = props.version ?? 1;
        this.startDate = props.startDate;
        this.endDate = props.endDate;
        this.servicesCovered = props.servicesCovered ?? [];
        this.cancellationTerms = props.cancellationTerms;
        this.penaltyClauses = props.penaltyClauses ?? [];
        this.advanceRules = props.advanceRules;
        this.settlementCycle = props.settlementCycle ?? 'TRIP_END';
        this.paymentTermsDays = props.paymentTermsDays ?? 7;
        this.contractDocumentUrl = props.contractDocumentUrl;
        this.status = props.status ?? 'DRAFT';
        this.signedAt = props.signedAt;
        this.signedByVendor = props.signedByVendor;
        this.signedByTenant = props.signedByTenant;
        this.previousVersionId = props.previousVersionId;
        this.notes = props.notes;
        this.createdBy = props.createdBy;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: VendorContractProps): VendorContract {
        return new VendorContract({
            ...props,
            id: props.id ?? generateId(),
        });
    }

    static fromPersistence(data: VendorContractProps & { id: string }): VendorContract {
        return new VendorContract(data);
    }

    isActive(): boolean {
        const now = new Date();
        return this.status === 'ACTIVE' && 
               this.startDate <= now && 
               this.endDate >= now;
    }
}
