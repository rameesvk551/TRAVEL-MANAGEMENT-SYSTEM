import { generateId } from '../../shared/utils/index.js';

/**
 * Booking source types - OTA-agnostic design.
 */
export type BookingSource = 'DIRECT' | 'OTA' | 'MANUAL' | 'CSV' | 'EMAIL';

export type BookingStatus =
    | 'pending'
    | 'confirmed'
    | 'checked_in'
    | 'checked_out'
    | 'cancelled'
    | 'no_show';

export interface BookingProps {
    id?: string;
    tenantId: string;
    resourceId: string;
    leadId?: string;
    createdById?: string;
    source: BookingSource;
    sourcePlatform?: string;
    externalRef?: string;
    startDate: Date;
    endDate: Date;
    status?: BookingStatus;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    guestCount?: number;
    baseAmount: number;
    taxAmount?: number;
    totalAmount: number;
    currency?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Booking entity - unified booking model for all resource types.
 * Normalizes bookings from any source (direct, OTA, manual, CSV, email).
 */
export class Booking {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly resourceId: string;
    public readonly leadId?: string;
    public readonly createdById?: string;
    public readonly source: BookingSource;
    public readonly sourcePlatform?: string;
    public readonly externalRef?: string;
    public readonly startDate: Date;
    public readonly endDate: Date;
    public readonly status: BookingStatus;
    public readonly guestName: string;
    public readonly guestEmail?: string;
    public readonly guestPhone?: string;
    public readonly guestCount: number;
    public readonly baseAmount: number;
    public readonly taxAmount: number;
    public readonly totalAmount: number;
    public readonly currency: string;
    public readonly notes?: string;
    public readonly metadata: Record<string, unknown>;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<Omit<BookingProps, 'leadId' | 'createdById' | 'sourcePlatform' | 'externalRef' | 'guestEmail' | 'guestPhone' | 'notes'>> & Pick<BookingProps, 'leadId' | 'createdById' | 'sourcePlatform' | 'externalRef' | 'guestEmail' | 'guestPhone' | 'notes'>) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.resourceId = props.resourceId;
        this.leadId = props.leadId;
        this.createdById = props.createdById;
        this.source = props.source;
        this.sourcePlatform = props.sourcePlatform;
        this.externalRef = props.externalRef;
        this.startDate = props.startDate;
        this.endDate = props.endDate;
        this.status = props.status;
        this.guestName = props.guestName;
        this.guestEmail = props.guestEmail;
        this.guestPhone = props.guestPhone;
        this.guestCount = props.guestCount;
        this.baseAmount = props.baseAmount;
        this.taxAmount = props.taxAmount;
        this.totalAmount = props.totalAmount;
        this.currency = props.currency;
        this.notes = props.notes;
        this.metadata = props.metadata;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: BookingProps): Booking {
        const now = new Date();
        return new Booking({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            resourceId: props.resourceId,
            leadId: props.leadId,
            createdById: props.createdById,
            source: props.source,
            sourcePlatform: props.sourcePlatform,
            externalRef: props.externalRef,
            startDate: props.startDate,
            endDate: props.endDate,
            status: props.status ?? 'confirmed',
            guestName: props.guestName,
            guestEmail: props.guestEmail,
            guestPhone: props.guestPhone,
            guestCount: props.guestCount ?? 1,
            baseAmount: props.baseAmount,
            taxAmount: props.taxAmount ?? 0,
            totalAmount: props.totalAmount,
            currency: props.currency ?? 'INR',
            notes: props.notes,
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    static fromPersistence(data: BookingProps): Booking {
        return Booking.create(data);
    }
}
