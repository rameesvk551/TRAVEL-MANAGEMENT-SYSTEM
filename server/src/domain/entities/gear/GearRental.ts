import { generateId } from '../../../shared/utils/index.js';

/**
 * Rental types
 */
export type GearRentalType = 
    | 'CUSTOMER'        // Rented to individual trekker
    | 'PARTNER'         // Rented to another operator
    | 'CORPORATE'       // Corporate/group rental
    | 'EMERGENCY';      // Emergency on-trip rental

/**
 * Rental pricing model
 */
export type RentalPricingModel = 
    | 'PER_DAY'         // Daily rate
    | 'PER_TRIP'        // Flat trip rate
    | 'PER_WEEK'        // Weekly rate
    | 'CUSTOM';         // Custom pricing

/**
 * Rental status
 */
export type GearRentalStatus = 
    | 'QUOTE'           // Quote provided
    | 'RESERVED'        // Reserved, not yet issued
    | 'ACTIVE'          // Currently rented out
    | 'OVERDUE'         // Past return date
    | 'RETURNED'        // Gear returned
    | 'RETURNED_DAMAGED'// Returned with damage
    | 'EXTENDED'        // Rental extended
    | 'CANCELLED'       // Rental cancelled
    | 'DISPUTED';       // In dispute

export interface GearRentalItemProps {
    gearItemId: string;
    dailyRate: number;
    tripRate: number;
    days: number;
    subtotal: number;
    depositAmount: number;
    returnCondition?: string;
    damageReportId?: string;
}

export interface GearRentalProps {
    id?: string;
    tenantId: string;
    rentalNumber?: string;
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
    items: GearRentalItemProps[];
    startDate: Date;
    endDate: Date;
    actualReturnDate?: Date;
    totalDays?: number;
    subtotal: number;
    discountAmount?: number;
    discountReason?: string;
    taxAmount?: number;
    totalAmount: number;
    depositAmount: number;
    depositPaid?: number;
    depositRefunded?: number;
    depositForfeited?: number;
    damageCharges?: number;
    lateReturnCharges?: number;
    lateReturnDays?: number;
    lateFeePerDay?: number;
    currency?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    paymentReference?: string;
    issuedByUserId?: string;
    issuedAt?: Date;
    receivedByUserId?: string;
    receivedAt?: Date;
    terms?: string;
    signatureData?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * GearRental entity - manages gear rental transactions.
 * Supports various rental types, deposits, and late fees.
 */
export class GearRental {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly rentalNumber: string;
    public readonly rentalType: GearRentalType;
    public readonly pricingModel: RentalPricingModel;
    public readonly status: GearRentalStatus;
    public readonly customerId?: string;
    public readonly customerName: string;
    public readonly customerEmail?: string;
    public readonly customerPhone?: string;
    public readonly customerIdType?: string;
    public readonly customerIdNumber?: string;
    public readonly partnerVendorId?: string;
    public readonly tripId?: string;
    public readonly bookingId?: string;
    public readonly items: GearRentalItemProps[];
    public readonly startDate: Date;
    public readonly endDate: Date;
    public readonly actualReturnDate?: Date;
    public readonly totalDays: number;
    public readonly subtotal: number;
    public readonly discountAmount: number;
    public readonly discountReason: string;
    public readonly taxAmount: number;
    public readonly totalAmount: number;
    public readonly depositAmount: number;
    public readonly depositPaid: number;
    public readonly depositRefunded: number;
    public readonly depositForfeited: number;
    public readonly damageCharges: number;
    public readonly lateReturnCharges: number;
    public readonly lateReturnDays: number;
    public readonly lateFeePerDay: number;
    public readonly currency: string;
    public readonly paymentStatus: string;
    public readonly paymentMethod: string;
    public readonly paymentReference: string;
    public readonly issuedByUserId?: string;
    public readonly issuedAt?: Date;
    public readonly receivedByUserId?: string;
    public readonly receivedAt?: Date;
    public readonly terms: string;
    public readonly signatureData?: string;
    public readonly notes: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: GearRentalProps) {
        Object.assign(this, props);
    }

    static create(props: GearRentalProps): GearRental {
        const totalDays = props.totalDays ?? 
            Math.ceil((props.endDate.getTime() - props.startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return new GearRental({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            rentalNumber: props.rentalNumber ?? `RNT-${Date.now()}`,
            rentalType: props.rentalType,
            pricingModel: props.pricingModel,
            status: props.status ?? 'QUOTE',
            customerId: props.customerId,
            customerName: props.customerName,
            customerEmail: props.customerEmail,
            customerPhone: props.customerPhone,
            customerIdType: props.customerIdType,
            customerIdNumber: props.customerIdNumber,
            partnerVendorId: props.partnerVendorId,
            tripId: props.tripId,
            bookingId: props.bookingId,
            items: props.items ?? [],
            startDate: props.startDate,
            endDate: props.endDate,
            actualReturnDate: props.actualReturnDate,
            totalDays,
            subtotal: props.subtotal,
            discountAmount: props.discountAmount ?? 0,
            discountReason: props.discountReason ?? '',
            taxAmount: props.taxAmount ?? 0,
            totalAmount: props.totalAmount,
            depositAmount: props.depositAmount,
            depositPaid: props.depositPaid ?? 0,
            depositRefunded: props.depositRefunded ?? 0,
            depositForfeited: props.depositForfeited ?? 0,
            damageCharges: props.damageCharges ?? 0,
            lateReturnCharges: props.lateReturnCharges ?? 0,
            lateReturnDays: props.lateReturnDays ?? 0,
            lateFeePerDay: props.lateFeePerDay ?? 0,
            currency: props.currency ?? 'INR',
            paymentStatus: props.paymentStatus ?? 'PENDING',
            paymentMethod: props.paymentMethod ?? '',
            paymentReference: props.paymentReference ?? '',
            issuedByUserId: props.issuedByUserId,
            issuedAt: props.issuedAt,
            receivedByUserId: props.receivedByUserId,
            receivedAt: props.receivedAt,
            terms: props.terms ?? '',
            signatureData: props.signatureData,
            notes: props.notes ?? '',
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: GearRentalProps): GearRental {
        return GearRental.create(data);
    }

    /**
     * Calculate total receivable including late fees
     */
    getTotalReceivable(): number {
        return this.totalAmount + this.lateReturnCharges + this.damageCharges;
    }

    /**
     * Calculate deposit balance
     */
    getDepositBalance(): number {
        return this.depositPaid - this.depositRefunded - this.depositForfeited;
    }

    /**
     * Check if rental is overdue
     */
    isOverdue(): boolean {
        if (this.actualReturnDate) return false;
        return new Date() > this.endDate && this.status === 'ACTIVE';
    }

    /**
     * Calculate late days
     */
    getLateDays(): number {
        if (!this.isOverdue()) return 0;
        const now = this.actualReturnDate || new Date();
        const diff = now.getTime() - this.endDate.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
}
