import { generateId } from '../../../shared/utils/index.js';

/**
 * Gear ownership type - who owns the gear
 */
export type GearOwnershipType = 
    | 'OWNED'           // Company-owned
    | 'RENTED_IN'       // Rented from external vendor
    | 'SUBLEASED'       // Sub-leased from partner
    | 'CUSTOMER';       // Customer's own gear (tracked)

/**
 * Gear condition score - health status of gear
 */
export type GearCondition = 
    | 'NEW'             // Brand new, unused
    | 'EXCELLENT'       // Like new, minimal wear
    | 'GOOD'            // Normal wear, fully functional
    | 'FAIR'            // Visible wear, functional
    | 'WORN'            // Significant wear, needs attention
    | 'CRITICAL'        // Requires immediate maintenance
    | 'UNSAFE'          // DO NOT USE - safety hazard
    | 'RETIRED';        // Permanently out of service

/**
 * Size variants for gear items
 */
export type GearSize = 
    | 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'  // Clothing
    | 'ONE_SIZE'                                               // Universal
    | '1P' | '2P' | '3P' | '4P' | '6P' | '8P'                  // Tent capacity
    | 'CUSTOM';                                                 // Custom size

export interface GearItemProps {
    id?: string;
    tenantId: string;
    categoryId: string;
    sku: string;
    name: string;
    model?: string;
    brand?: string;
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
    purchaseDate?: Date;
    purchasePrice?: number;
    currentValue?: number;
    currency?: string;
    warrantyExpiry?: Date;
    expectedLifespanDays?: number;
    expectedLifespanTrips?: number;
    totalTripsUsed?: number;
    totalDaysUsed?: number;
    lastInspectionDate?: Date;
    nextInspectionDue?: Date;
    lastMaintenanceDate?: Date;
    nextMaintenanceDue?: Date;
    isSafetyCritical?: boolean;
    isRentable?: boolean;
    rentalPricePerDay?: number;
    rentalPricePerTrip?: number;
    depositAmount?: number;
    specifications?: Record<string, unknown>;
    notes?: string;
    images?: string[];
    documents?: string[];
    locationId?: string;
    warehouseId?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * GearItem entity - individual trackable gear piece.
 * Supports full lifecycle tracking, condition monitoring, and rental.
 */
export class GearItem {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly categoryId: string;
    public readonly sku: string;
    public readonly name: string;
    public readonly model: string;
    public readonly brand: string;
    public readonly serialNumber?: string;
    public readonly barcode?: string;
    public readonly qrCode?: string;
    public readonly rfidTag?: string;
    public readonly ownershipType: GearOwnershipType;
    public readonly vendorId?: string;
    public readonly size?: GearSize;
    public readonly sizeValue?: string;
    public readonly color?: string;
    public readonly condition: GearCondition;
    public readonly conditionScore: number;
    public readonly purchaseDate?: Date;
    public readonly purchasePrice: number;
    public readonly currentValue: number;
    public readonly currency: string;
    public readonly warrantyExpiry?: Date;
    public readonly expectedLifespanDays: number;
    public readonly expectedLifespanTrips: number;
    public readonly totalTripsUsed: number;
    public readonly totalDaysUsed: number;
    public readonly lastInspectionDate?: Date;
    public readonly nextInspectionDue?: Date;
    public readonly lastMaintenanceDate?: Date;
    public readonly nextMaintenanceDue?: Date;
    public readonly isSafetyCritical: boolean;
    public readonly isRentable: boolean;
    public readonly rentalPricePerDay: number;
    public readonly rentalPricePerTrip: number;
    public readonly depositAmount: number;
    public readonly specifications: Record<string, unknown>;
    public readonly notes: string;
    public readonly images: string[];
    public readonly documents: string[];
    public readonly locationId?: string;
    public readonly warehouseId?: string;
    public readonly isActive: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<Omit<GearItemProps, 
        'serialNumber' | 'barcode' | 'qrCode' | 'rfidTag' | 'vendorId' | 
        'size' | 'sizeValue' | 'color' | 'purchaseDate' | 'warrantyExpiry' |
        'lastInspectionDate' | 'nextInspectionDue' | 'lastMaintenanceDate' | 
        'nextMaintenanceDue' | 'locationId' | 'warehouseId'
    >> & Pick<GearItemProps, 
        'serialNumber' | 'barcode' | 'qrCode' | 'rfidTag' | 'vendorId' |
        'size' | 'sizeValue' | 'color' | 'purchaseDate' | 'warrantyExpiry' |
        'lastInspectionDate' | 'nextInspectionDue' | 'lastMaintenanceDate' |
        'nextMaintenanceDue' | 'locationId' | 'warehouseId'
    >) {
        Object.assign(this, props);
    }

    static create(props: GearItemProps): GearItem {
        return new GearItem({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            categoryId: props.categoryId,
            sku: props.sku,
            name: props.name,
            model: props.model ?? '',
            brand: props.brand ?? '',
            serialNumber: props.serialNumber,
            barcode: props.barcode,
            qrCode: props.qrCode,
            rfidTag: props.rfidTag,
            ownershipType: props.ownershipType,
            vendorId: props.vendorId,
            size: props.size,
            sizeValue: props.sizeValue,
            color: props.color,
            condition: props.condition,
            conditionScore: props.conditionScore,
            purchaseDate: props.purchaseDate,
            purchasePrice: props.purchasePrice ?? 0,
            currentValue: props.currentValue ?? props.purchasePrice ?? 0,
            currency: props.currency ?? 'INR',
            warrantyExpiry: props.warrantyExpiry,
            expectedLifespanDays: props.expectedLifespanDays ?? 365,
            expectedLifespanTrips: props.expectedLifespanTrips ?? 50,
            totalTripsUsed: props.totalTripsUsed ?? 0,
            totalDaysUsed: props.totalDaysUsed ?? 0,
            lastInspectionDate: props.lastInspectionDate,
            nextInspectionDue: props.nextInspectionDue,
            lastMaintenanceDate: props.lastMaintenanceDate,
            nextMaintenanceDue: props.nextMaintenanceDue,
            isSafetyCritical: props.isSafetyCritical ?? false,
            isRentable: props.isRentable ?? false,
            rentalPricePerDay: props.rentalPricePerDay ?? 0,
            rentalPricePerTrip: props.rentalPricePerTrip ?? 0,
            depositAmount: props.depositAmount ?? 0,
            specifications: props.specifications ?? {},
            notes: props.notes ?? '',
            images: props.images ?? [],
            documents: props.documents ?? [],
            locationId: props.locationId,
            warehouseId: props.warehouseId,
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: GearItemProps): GearItem {
        return GearItem.create(data);
    }

    /**
     * Check if gear is safe for assignment
     */
    isSafeForAssignment(): boolean {
        if (this.condition === 'UNSAFE' || this.condition === 'RETIRED') {
            return false;
        }
        if (this.isSafetyCritical && this.isInspectionOverdue()) {
            return false;
        }
        return true;
    }

    /**
     * Check if inspection is overdue
     */
    isInspectionOverdue(): boolean {
        if (!this.nextInspectionDue) return false;
        return new Date() > this.nextInspectionDue;
    }

    /**
     * Check if maintenance is overdue
     */
    isMaintenanceOverdue(): boolean {
        if (!this.nextMaintenanceDue) return false;
        return new Date() > this.nextMaintenanceDue;
    }

    /**
     * Calculate remaining lifespan percentage
     */
    getRemainingLifespanPercent(): number {
        const daysPct = this.expectedLifespanDays > 0 
            ? Math.max(0, 100 - (this.totalDaysUsed / this.expectedLifespanDays * 100))
            : 100;
        const tripsPct = this.expectedLifespanTrips > 0
            ? Math.max(0, 100 - (this.totalTripsUsed / this.expectedLifespanTrips * 100))
            : 100;
        return Math.min(daysPct, tripsPct);
    }
}
