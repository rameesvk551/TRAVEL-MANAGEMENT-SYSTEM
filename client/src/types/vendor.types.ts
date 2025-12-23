// ============================================================================
// VENDOR TYPES
// ============================================================================

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

export interface Vendor {
    id: string;
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
    country: string;
    postalCode?: string;
    serviceRegions: string[];
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    upiId?: string;
    taxId?: string;
    taxType?: string;
    paymentPreference: 'BANK' | 'UPI' | 'CASH';
    defaultCurrency: string;
    complianceDocuments: ComplianceDocument[];
    serviceCapacity?: number;
    reliabilityScore: number;
    totalAssignments: number;
    completedAssignments: number;
    cancelledAssignments: number;
    disputeCount: number;
    onTimeRate: number;
    internalRating: number;
    internalNotes?: string;
    status: VendorStatus;
    attributes: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVendorInput {
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
    serviceCapacity?: number;
    attributes?: Record<string, unknown>;
}

export type UpdateVendorInput = Partial<CreateVendorInput> & {
    internalRating?: number;
    internalNotes?: string;
};

// ============================================================================
// ASSIGNMENT TYPES
// ============================================================================

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

export interface VendorAssignment {
    id: string;
    tenantId: string;
    vendorId: string;
    bookingId?: string;
    resourceId?: string;
    departureId?: string;
    assignmentType?: string;
    serviceDescription?: string;
    serviceStartDate: string;
    serviceEndDate: string;
    rateId?: string;
    rateSnapshot?: RateSnapshot;
    quantity: number;
    unitType?: string;
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
    currency: string;
    status: AssignmentStatus;
    acceptedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    replacedById?: string;
    replacesId?: string;
    fulfilmentPercentage: number;
    fulfilmentNotes?: string;
    customerRating?: number;
    customerFeedback?: string;
    internalNotes?: string;
    createdAt: string;
    updatedAt: string;
    // Joined data
    vendor?: Vendor;
}

export interface CreateAssignmentInput {
    vendorId: string;
    bookingId?: string;
    resourceId?: string;
    departureId?: string;
    assignmentType?: string;
    serviceDescription?: string;
    serviceStartDate: string;
    serviceEndDate: string;
    rateId?: string;
    rateSnapshot?: RateSnapshot;
    quantity?: number;
    unitType?: string;
    grossAmount: number;
    discountAmount?: number;
    netAmount: number;
    currency?: string;
    replacesId?: string;
    internalNotes?: string;
}

export interface UpdateAssignmentInput {
    serviceDescription?: string;
    serviceStartDate?: string;
    serviceEndDate?: string;
    quantity?: number;
    grossAmount?: number;
    discountAmount?: number;
    netAmount?: number;
    fulfilmentPercentage?: number;
    fulfilmentNotes?: string;
    customerRating?: number;
    customerFeedback?: string;
    internalNotes?: string;
}

// ============================================================================
// PAYABLE TYPES
// ============================================================================

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

export interface VendorPayable {
    id: string;
    tenantId: string;
    vendorId: string;
    assignmentId?: string;
    payableNumber?: string;
    grossAmount: number;
    advancePaid: number;
    deductions: number;
    penalties: number;
    adjustments: number;
    taxAmount: number;
    netPayable: number;
    currency: string;
    deductionDetails: DeductionDetail[];
    dueDate?: string;
    status: PayableStatus;
    approvedAt?: string;
    approvedBy?: string;
    amountSettled: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    // Joined data
    vendor?: Vendor;
    assignment?: VendorAssignment;
}

export interface CreatePayableInput {
    vendorId: string;
    assignmentId?: string;
    grossAmount: number;
    advancePaid?: number;
    deductions?: number;
    penalties?: number;
    adjustments?: number;
    taxAmount?: number;
    netPayable: number;
    currency?: string;
    deductionDetails?: DeductionDetail[];
    dueDate?: string;
    notes?: string;
}

export interface UpdatePayableInput {
    grossAmount?: number;
    advancePaid?: number;
    deductions?: number;
    penalties?: number;
    adjustments?: number;
    taxAmount?: number;
    netPayable?: number;
    deductionDetails?: DeductionDetail[];
    dueDate?: string;
    notes?: string;
}

export interface PayableSummary {
    totalPending: number;
    totalApproved: number;
    totalSettled: number;
    totalOnHold: number;
    totalDisputed: number;
}

// ============================================================================
// SETTLEMENT TYPES
// ============================================================================

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

export interface VendorSettlement {
    id: string;
    tenantId: string;
    vendorId: string;
    settlementNumber?: string;
    payableIds: string[];
    amount: number;
    currency: string;
    paymentMethod: SettlementMethod;
    paymentReference?: string;
    paymentDate: string;
    bankDetailsSnapshot: BankDetailsSnapshot;
    isVerified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    // Joined data
    vendor?: Vendor;
}

export interface CreateSettlementInput {
    vendorId: string;
    payableIds: string[];
    payableAmounts: Array<{ payableId: string; amount: number }>;
    totalAmount: number;
    currency?: string;
    paymentMethod: SettlementMethod;
    paymentReference?: string;
    paymentDate: string;
    notes?: string;
}

export interface SettlementSummary {
    totalAmount: number;
    count: number;
    byMethod: Record<SettlementMethod, number>;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface VendorFilters {
    vendorType?: VendorType;
    status?: VendorStatus;
    search?: string;
    city?: string;
    page?: number;
    limit?: number;
}

export interface AssignmentFilters {
    vendorId?: string;
    bookingId?: string;
    status?: AssignmentStatus;
    serviceDateFrom?: string;
    serviceDateTo?: string;
    page?: number;
    limit?: number;
}

export interface PayableFilters {
    vendorId?: string;
    status?: PayableStatus;
    dueDateFrom?: string;
    dueDateTo?: string;
    page?: number;
    limit?: number;
}

export interface SettlementFilters {
    vendorId?: string;
    paymentMethod?: SettlementMethod;
    isVerified?: boolean;
    paymentDateFrom?: string;
    paymentDateTo?: string;
    page?: number;
    limit?: number;
}
