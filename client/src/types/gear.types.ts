/**
 * Gear Management System - TypeScript Types
 * Enterprise-grade trekking equipment management
 */

// ============================================
// CATEGORY TYPES
// ============================================

export type GearCategoryType =
    | 'SHELTER'
    | 'SLEEPING'
    | 'CLOTHING'
    | 'CLIMBING'
    | 'SAFETY'
    | 'NAVIGATION'
    | 'COOKING'
    | 'LIGHTING'
    | 'TRANSPORT'
    | 'TECHNICAL'
    | 'COMMUNICATION'
    | 'MEDICAL'
    | 'FURNITURE'
    | 'POWER'
    | 'OTHER';

export interface GearCategory {
    id: string;
    tenantId: string;
    name: string;
    type: GearCategoryType;
    parentId?: string;
    description: string;
    isSafetyCritical: boolean;
    inspectionIntervalDays: number;
    maintenanceIntervalDays: number;
    attributes: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// GEAR ITEM TYPES
// ============================================

export type GearOwnershipType = 'OWNED' | 'RENTED_IN' | 'SUBLEASED' | 'CUSTOMER';

export type GearCondition =
    | 'NEW'
    | 'EXCELLENT'
    | 'GOOD'
    | 'FAIR'
    | 'WORN'
    | 'CRITICAL'
    | 'UNSAFE'
    | 'RETIRED';

export type GearSize =
    | 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
    | 'ONE_SIZE'
    | '1P' | '2P' | '3P' | '4P' | '6P' | '8P'
    | 'CUSTOM';

export interface GearItem {
    id: string;
    tenantId: string;
    categoryId: string;
    sku: string;
    name: string;
    model: string;
    brand: string;
    serialNumber?: string;
    barcode?: string;
    qrCode?: string;
    rfidTag?: string;
    ownershipType: GearOwnershipType;
    vendorId?: string;
    size?: GearSize;
    sizeValue?: string;
    color?: string;
    condition: GearCondition;
    conditionScore: number;
    purchaseDate?: string;
    purchasePrice: number;
    currentValue: number;
    currency: string;
    warrantyExpiry?: string;
    expectedLifespanDays: number;
    expectedLifespanTrips: number;
    totalTripsUsed: number;
    totalDaysUsed: number;
    lastInspectionDate?: string;
    nextInspectionDue?: string;
    lastMaintenanceDate?: string;
    nextMaintenanceDue?: string;
    isSafetyCritical: boolean;
    isRentable: boolean;
    rentalPricePerDay: number;
    rentalPricePerTrip: number;
    depositAmount: number;
    specifications: Record<string, unknown>;
    notes: string;
    images: string[];
    documents: string[];
    warehouseId?: string;
    locationId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// INVENTORY TYPES
// ============================================

export type GearInventoryStatus =
    | 'AVAILABLE'
    | 'RESERVED'
    | 'ASSIGNED'
    | 'IN_USE'
    | 'IN_TRANSIT'
    | 'UNDER_MAINTENANCE'
    | 'UNDER_INSPECTION'
    | 'DAMAGED'
    | 'LOST'
    | 'RENTED_OUT'
    | 'QUARANTINE'
    | 'RETIRED';

export interface GearInventory {
    id: string;
    tenantId: string;
    gearItemId: string;
    warehouseId?: string;
    locationId?: string;
    zoneCode?: string;
    binCode?: string;
    shelfCode?: string;
    status: GearInventoryStatus;
    previousStatus?: GearInventoryStatus;
    statusChangedAt: string;
    statusChangedBy?: string;
    statusReason?: string;
    tripId?: string;
    rentalId?: string;
    reservedUntil?: string;
    assignedToUserId?: string;
    assignedToGuestId?: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface GearItemWithInventory {
    item: GearItem;
    inventory?: GearInventory;
}

// ============================================
// ASSIGNMENT TYPES
// ============================================

export type GearAssignmentType =
    | 'PARTICIPANT'
    | 'SHARED'
    | 'GUIDE'
    | 'EMERGENCY'
    | 'SUPPORT';

export type GearAssignmentStatus =
    | 'PLANNED'
    | 'RESERVED'
    | 'ISSUED'
    | 'IN_USE'
    | 'RETURNED'
    | 'PARTIAL_RETURN'
    | 'DAMAGED'
    | 'LOST'
    | 'REPLACED'
    | 'CANCELLED';

export interface GearAssignment {
    id: string;
    tenantId: string;
    tripId: string;
    bookingId?: string;
    gearItemId: string;
    assignmentType: GearAssignmentType;
    status: GearAssignmentStatus;
    assignedToUserId?: string;
    assignedToGuestId?: string;
    assignedToName?: string;
    assignedByUserId?: string;
    plannedIssueDate?: string;
    actualIssueDate?: string;
    issuedByUserId?: string;
    issueNotes: string;
    issueCondition: string;
    plannedReturnDate?: string;
    actualReturnDate?: string;
    receivedByUserId?: string;
    returnNotes: string;
    returnCondition: string;
    returnConditionScore: number;
    replacedByItemId?: string;
    replacementReason: string;
    damageReportId?: string;
    checklistCompleted: boolean;
    checklistData: Record<string, unknown>;
    gpsCoordinates?: string;
    signatureData?: string;
    photos: string[];
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface TripGearManifest {
    tripId: string;
    assignments: GearAssignment[];
    byType: Record<GearAssignmentType, GearAssignment[]>;
    totalItems: number;
    issuedCount: number;
    returnedCount: number;
    pendingIssue: number;
    pendingReturn: number;
}

// ============================================
// RENTAL TYPES
// ============================================

export type GearRentalType = 'CUSTOMER' | 'PARTNER' | 'CORPORATE' | 'EMERGENCY';
export type RentalPricingModel = 'PER_DAY' | 'PER_TRIP' | 'PER_WEEK' | 'CUSTOM';
export type GearRentalStatus =
    | 'QUOTE'
    | 'RESERVED'
    | 'ACTIVE'
    | 'OVERDUE'
    | 'RETURNED'
    | 'RETURNED_DAMAGED'
    | 'EXTENDED'
    | 'CANCELLED'
    | 'DISPUTED';

export interface GearRentalItem {
    gearItemId: string;
    dailyRate: number;
    tripRate: number;
    days: number;
    subtotal: number;
    depositAmount: number;
    returnCondition?: string;
    damageReportId?: string;
}

export interface GearRental {
    id: string;
    tenantId: string;
    rentalNumber: string;
    rentalType: GearRentalType;
    pricingModel: RentalPricingModel;
    status: GearRentalStatus;
    customerId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerIdType?: string;
    customerIdNumber?: string;
    partnerVendorId?: string;
    tripId?: string;
    bookingId?: string;
    items: GearRentalItem[];
    startDate: string;
    endDate: string;
    actualReturnDate?: string;
    totalDays: number;
    subtotal: number;
    discountAmount: number;
    discountReason: string;
    taxAmount: number;
    totalAmount: number;
    depositAmount: number;
    depositPaid: number;
    depositRefunded: number;
    depositForfeited: number;
    damageCharges: number;
    lateReturnCharges: number;
    lateReturnDays: number;
    lateFeePerDay: number;
    currency: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentReference: string;
    issuedByUserId?: string;
    issuedAt?: string;
    receivedByUserId?: string;
    receivedAt?: string;
    terms: string;
    signatureData?: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// DAMAGE REPORT TYPES
// ============================================

export type DamageSeverity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'TOTAL_LOSS';
export type DamageResponsibility =
    | 'NORMAL_WEAR'
    | 'CUSTOMER'
    | 'STAFF'
    | 'VENDOR'
    | 'FORCE_MAJEURE'
    | 'MANUFACTURING'
    | 'UNKNOWN'
    | 'THEFT';
export type DamageReportStatus =
    | 'REPORTED'
    | 'UNDER_REVIEW'
    | 'ASSESSED'
    | 'REPAIR_SCHEDULED'
    | 'IN_REPAIR'
    | 'REPAIRED'
    | 'WRITTEN_OFF'
    | 'INSURANCE_CLAIM'
    | 'RESOLVED'
    | 'DISPUTED';

export interface GearDamageReport {
    id: string;
    tenantId: string;
    gearItemId: string;
    tripId?: string;
    assignmentId?: string;
    rentalId?: string;
    reportedByUserId: string;
    reportedAt: string;
    incidentDate?: string;
    incidentLocation?: string;
    severity: DamageSeverity;
    responsibility: DamageResponsibility;
    status: DamageReportStatus;
    description: string;
    damageDetails: Record<string, unknown>;
    photos: string[];
    videos: string[];
    assessedByUserId?: string;
    assessedAt?: string;
    assessmentNotes: string;
    estimatedRepairCost: number;
    actualRepairCost: number;
    replacementCost: number;
    insuranceCovered: boolean;
    insuranceClaimId?: string;
    insuranceAmount: number;
    chargedToCustomer: boolean;
    customerChargeAmount: number;
    repairVendorId?: string;
    repairStartDate?: string;
    repairEndDate?: string;
    repairNotes: string;
    resolutionNotes: string;
    resolvedByUserId?: string;
    resolvedAt?: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// WAREHOUSE TYPES
// ============================================

export type WarehouseType = 'MAIN' | 'BASE_CAMP' | 'TRANSIT' | 'PARTNER' | 'MOBILE';

export interface GearWarehouse {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    type: WarehouseType;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    operatingHours: string;
    capacity: number;
    zones: string[];
    isActive: boolean;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// SUMMARY & ANALYTICS TYPES
// ============================================

export interface InventorySummary {
    totalItems: number;
    byStatus: Record<GearInventoryStatus, number>;
    available: number;
    inUse: number;
    underMaintenance: number;
    damaged: number;
    rentedOut: number;
}

export interface AvailabilityResult {
    isAvailable: boolean;
    availableCount: number;
    requestedCount: number;
    availableItems: GearItem[];
    shortfall: number;
}

export interface InventoryHeatmap {
    byCategory: Record<string, {
        available: number;
        total: number;
        utilizationPercent: number;
    }>;
    byCondition: Record<string, number>;
    alerts: Array<{
        type: 'danger' | 'warning' | 'info';
        count: number;
        message: string;
    }>;
}

// ============================================
// FILTER TYPES
// ============================================

export interface GearCategoryFilters {
    type?: GearCategoryType;
    parentId?: string;
    isSafetyCritical?: boolean;
    isActive?: boolean;
    search?: string;
}

export interface GearItemFilters {
    categoryId?: string;
    condition?: GearCondition | GearCondition[];
    ownershipType?: GearOwnershipType;
    warehouseId?: string;
    isSafetyCritical?: boolean;
    isRentable?: boolean;
    isActive?: boolean;
    inspectionOverdue?: boolean;
    maintenanceOverdue?: boolean;
    search?: string;
}

export interface GearAssignmentFilters {
    tripId?: string;
    bookingId?: string;
    gearItemId?: string;
    assignmentType?: GearAssignmentType;
    status?: GearAssignmentStatus | GearAssignmentStatus[];
    pendingReturn?: boolean;
    overdue?: boolean;
}

// ============================================
// DTO TYPES (for API requests)
// ============================================

export interface CreateGearCategoryDTO {
    name: string;
    type: GearCategoryType;
    parentId?: string;
    description?: string;
    isSafetyCritical: boolean;
    inspectionIntervalDays?: number;
    maintenanceIntervalDays?: number;
    attributes?: Record<string, unknown>;
}

export interface CreateGearItemDTO {
    categoryId: string;
    sku: string;
    name: string;
    model?: string;
    brand?: string;
    serialNumber?: string;
    barcode?: string;
    ownershipType: GearOwnershipType;
    vendorId?: string;
    size?: GearSize;
    sizeValue?: string;
    color?: string;
    condition: GearCondition;
    conditionScore: number;
    purchaseDate?: string;
    purchasePrice?: number;
    currentValue?: number;
    currency?: string;
    warrantyExpiry?: string;
    expectedLifespanDays?: number;
    expectedLifespanTrips?: number;
    isSafetyCritical?: boolean;
    isRentable?: boolean;
    rentalPricePerDay?: number;
    rentalPricePerTrip?: number;
    depositAmount?: number;
    specifications?: Record<string, unknown>;
    notes?: string;
    warehouseId?: string;
}

export interface CreateGearAssignmentDTO {
    tripId: string;
    bookingId?: string;
    gearItemId: string;
    assignmentType: GearAssignmentType;
    assignedToUserId?: string;
    assignedToGuestId?: string;
    assignedToName?: string;
    plannedIssueDate?: string;
    plannedReturnDate?: string;
    notes?: string;
}

export interface IssueGearDTO {
    issueNotes?: string;
    issueCondition?: string;
    checklistData?: Record<string, unknown>;
    gpsCoordinates?: string;
    signatureData?: string;
    photos?: string[];
}

export interface ReturnGearDTO {
    returnNotes?: string;
    returnCondition?: string;
    returnConditionScore?: number;
    hasDamage?: boolean;
    damageDescription?: string;
    photos?: string[];
}

export interface AvailabilityQuery {
    categoryId?: string;
    warehouseId?: string;
    size?: string;
    startDate: string;
    endDate: string;
    quantity: number;
}
