import { generateId } from '../../../shared/utils/index.js';

/**
 * Vendor types supporting all travel business models.
 */
export type VendorType =
    | 'TRANSPORT'
    | 'HOTEL'
    | 'EQUIPMENT'
    | 'GUIDE'
    | 'PERMIT_AGENT'
    | 'CATERING'
    | 'OTHER';

export type VendorStatus =
    | 'ACTIVE'
    | 'INACTIVE'
    | 'SUSPENDED'
    | 'PENDING_VERIFICATION'
    | 'BLACKLISTED';

export interface ComplianceDocument {
    type: string;
    number: string;
    expiry?: string;
    verified: boolean;
    documentUrl?: string;
}

export interface VendorProps {
    id?: string;
    tenantId: string;
    legalName: string;
    displayName: string;
    vendorType: VendorType;
    vendorCode?: string;
    primaryContactName?: string;
    primaryContactPhone?: string;
    primaryContactEmail?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    serviceRegions?: string[];
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    upiId?: string;
    taxId?: string;
    taxType?: string;
    paymentPreference?: 'BANK' | 'UPI' | 'CASH';
    defaultCurrency?: string;
    complianceDocuments?: ComplianceDocument[];
    serviceCapacity?: number;
    reliabilityScore?: number;
    totalAssignments?: number;
    completedAssignments?: number;
    cancelledAssignments?: number;
    disputeCount?: number;
    onTimeRate?: number;
    internalRating?: number;
    internalNotes?: string;
    status?: VendorStatus;
    attributes?: Record<string, unknown>;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Vendor entity - represents suppliers and service providers.
 */
export class Vendor {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly legalName: string;
    public readonly displayName: string;
    public readonly vendorType: VendorType;
    public readonly vendorCode?: string;
    public readonly primaryContactName?: string;
    public readonly primaryContactPhone?: string;
    public readonly primaryContactEmail?: string;
    public readonly emergencyContactName?: string;
    public readonly emergencyContactPhone?: string;
    public readonly addressLine1?: string;
    public readonly addressLine2?: string;
    public readonly city?: string;
    public readonly state?: string;
    public readonly country: string;
    public readonly postalCode?: string;
    public readonly serviceRegions: string[];
    public readonly bankName?: string;
    public readonly bankAccountNumber?: string;
    public readonly bankIfscCode?: string;
    public readonly upiId?: string;
    public readonly taxId?: string;
    public readonly taxType?: string;
    public readonly paymentPreference: 'BANK' | 'UPI' | 'CASH';
    public readonly defaultCurrency: string;
    public readonly complianceDocuments: ComplianceDocument[];
    public readonly serviceCapacity?: number;
    public readonly reliabilityScore: number;
    public readonly totalAssignments: number;
    public readonly completedAssignments: number;
    public readonly cancelledAssignments: number;
    public readonly disputeCount: number;
    public readonly onTimeRate: number;
    public readonly internalRating: number;
    public readonly internalNotes?: string;
    public readonly status: VendorStatus;
    public readonly attributes: Record<string, unknown>;
    public readonly createdBy?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<Omit<VendorProps, 
        'vendorCode' | 'primaryContactName' | 'primaryContactPhone' | 'primaryContactEmail' |
        'emergencyContactName' | 'emergencyContactPhone' | 'addressLine1' | 'addressLine2' |
        'city' | 'state' | 'postalCode' | 'bankName' | 'bankAccountNumber' | 'bankIfscCode' |
        'upiId' | 'taxId' | 'taxType' | 'serviceCapacity' | 'internalNotes' | 'createdBy'
    >> & Pick<VendorProps, 
        'vendorCode' | 'primaryContactName' | 'primaryContactPhone' | 'primaryContactEmail' |
        'emergencyContactName' | 'emergencyContactPhone' | 'addressLine1' | 'addressLine2' |
        'city' | 'state' | 'postalCode' | 'bankName' | 'bankAccountNumber' | 'bankIfscCode' |
        'upiId' | 'taxId' | 'taxType' | 'serviceCapacity' | 'internalNotes' | 'createdBy'
    >) {
        Object.assign(this, props);
    }

    static create(props: VendorProps): Vendor {
        return new Vendor({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            legalName: props.legalName,
            displayName: props.displayName,
            vendorType: props.vendorType,
            vendorCode: props.vendorCode,
            primaryContactName: props.primaryContactName,
            primaryContactPhone: props.primaryContactPhone,
            primaryContactEmail: props.primaryContactEmail,
            emergencyContactName: props.emergencyContactName,
            emergencyContactPhone: props.emergencyContactPhone,
            addressLine1: props.addressLine1,
            addressLine2: props.addressLine2,
            city: props.city,
            state: props.state,
            country: props.country ?? 'India',
            postalCode: props.postalCode,
            serviceRegions: props.serviceRegions ?? [],
            bankName: props.bankName,
            bankAccountNumber: props.bankAccountNumber,
            bankIfscCode: props.bankIfscCode,
            upiId: props.upiId,
            taxId: props.taxId,
            taxType: props.taxType,
            paymentPreference: props.paymentPreference ?? 'BANK',
            defaultCurrency: props.defaultCurrency ?? 'INR',
            complianceDocuments: props.complianceDocuments ?? [],
            serviceCapacity: props.serviceCapacity,
            reliabilityScore: props.reliabilityScore ?? 0,
            totalAssignments: props.totalAssignments ?? 0,
            completedAssignments: props.completedAssignments ?? 0,
            cancelledAssignments: props.cancelledAssignments ?? 0,
            disputeCount: props.disputeCount ?? 0,
            onTimeRate: props.onTimeRate ?? 100,
            internalRating: props.internalRating ?? 0,
            internalNotes: props.internalNotes,
            status: props.status ?? 'PENDING_VERIFICATION',
            attributes: props.attributes ?? {},
            createdBy: props.createdBy,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: VendorProps & { id: string }): Vendor {
        return Vendor.create(data);
    }
}
