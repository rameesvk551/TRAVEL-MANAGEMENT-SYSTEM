import { generateId } from '../../../shared/utils/index.js';

/**
 * Inventory status - current state of a gear item
 */
export type GearInventoryStatus = 
    | 'AVAILABLE'       // Ready for assignment
    | 'RESERVED'        // Reserved for upcoming trip
    | 'ASSIGNED'        // Assigned to active trip
    | 'IN_USE'          // Currently being used on trip
    | 'IN_TRANSIT'      // Being transported
    | 'UNDER_MAINTENANCE' // Undergoing repair
    | 'UNDER_INSPECTION'  // Being inspected
    | 'DAMAGED'         // Damaged, needs assessment
    | 'LOST'            // Reported lost
    | 'RENTED_OUT'      // Rented to customer/partner
    | 'QUARANTINE'      // Awaiting condition check
    | 'RETIRED';        // Permanently out of service

export interface GearInventoryProps {
    id?: string;
    tenantId: string;
    gearItemId: string;
    warehouseId?: string;
    locationId?: string;
    zoneCode?: string;
    binCode?: string;
    shelfCode?: string;
    status: GearInventoryStatus;
    previousStatus?: GearInventoryStatus;
    statusChangedAt?: Date;
    statusChangedBy?: string;
    statusReason?: string;
    tripId?: string;
    rentalId?: string;
    reservedUntil?: Date;
    assignedToUserId?: string;
    assignedToGuestId?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * GearInventory entity - tracks location and availability of gear.
 * Links gear items to warehouses, trips, and rentals.
 */
export class GearInventory {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly gearItemId: string;
    public readonly warehouseId?: string;
    public readonly locationId?: string;
    public readonly zoneCode?: string;
    public readonly binCode?: string;
    public readonly shelfCode?: string;
    public readonly status: GearInventoryStatus;
    public readonly previousStatus?: GearInventoryStatus;
    public readonly statusChangedAt: Date;
    public readonly statusChangedBy?: string;
    public readonly statusReason?: string;
    public readonly tripId?: string;
    public readonly rentalId?: string;
    public readonly reservedUntil?: Date;
    public readonly assignedToUserId?: string;
    public readonly assignedToGuestId?: string;
    public readonly notes: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<Omit<GearInventoryProps,
        'warehouseId' | 'locationId' | 'zoneCode' | 'binCode' | 'shelfCode' |
        'previousStatus' | 'statusChangedBy' | 'statusReason' | 'tripId' |
        'rentalId' | 'reservedUntil' | 'assignedToUserId' | 'assignedToGuestId'
    >> & Pick<GearInventoryProps,
        'warehouseId' | 'locationId' | 'zoneCode' | 'binCode' | 'shelfCode' |
        'previousStatus' | 'statusChangedBy' | 'statusReason' | 'tripId' |
        'rentalId' | 'reservedUntil' | 'assignedToUserId' | 'assignedToGuestId'
    >) {
        Object.assign(this, props);
    }

    static create(props: GearInventoryProps): GearInventory {
        return new GearInventory({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            gearItemId: props.gearItemId,
            warehouseId: props.warehouseId,
            locationId: props.locationId,
            zoneCode: props.zoneCode,
            binCode: props.binCode,
            shelfCode: props.shelfCode,
            status: props.status,
            previousStatus: props.previousStatus,
            statusChangedAt: props.statusChangedAt ?? new Date(),
            statusChangedBy: props.statusChangedBy,
            statusReason: props.statusReason,
            tripId: props.tripId,
            rentalId: props.rentalId,
            reservedUntil: props.reservedUntil,
            assignedToUserId: props.assignedToUserId,
            assignedToGuestId: props.assignedToGuestId,
            notes: props.notes ?? '',
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: GearInventoryProps): GearInventory {
        return GearInventory.create(data);
    }

    /**
     * Check if gear can be assigned
     */
    canBeAssigned(): boolean {
        return this.status === 'AVAILABLE';
    }

    /**
     * Check if gear can be reserved
     */
    canBeReserved(): boolean {
        return this.status === 'AVAILABLE' || 
            (this.status === 'RESERVED' && this.reservedUntil && new Date() > this.reservedUntil);
    }

    /**
     * Get location string for display
     */
    getLocationString(): string {
        const parts = [
            this.zoneCode,
            this.shelfCode,
            this.binCode,
        ].filter(Boolean);
        return parts.join('-') || 'Unassigned';
    }
}
