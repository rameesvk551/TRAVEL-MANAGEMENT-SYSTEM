import { generateId } from '../../../shared/utils/index.js';

/**
 * Warehouse type
 */
export type WarehouseType = 
    | 'MAIN'            // Main headquarters warehouse
    | 'BASE_CAMP'       // Base camp storage
    | 'TRANSIT'         // Transit point
    | 'PARTNER'         // Partner location
    | 'MOBILE';         // Mobile/vehicle storage

export interface GearWarehouseProps {
    id?: string;
    tenantId: string;
    name: string;
    code: string;
    type: WarehouseType;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    operatingHours?: string;
    capacity?: number;
    zones?: string[];
    isActive?: boolean;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * GearWarehouse entity - storage locations for gear.
 */
export class GearWarehouse {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly name: string;
    public readonly code: string;
    public readonly type: WarehouseType;
    public readonly address: string;
    public readonly city: string;
    public readonly state: string;
    public readonly country: string;
    public readonly postalCode: string;
    public readonly latitude?: number;
    public readonly longitude?: number;
    public readonly altitude?: number;
    public readonly contactName: string;
    public readonly contactPhone: string;
    public readonly contactEmail: string;
    public readonly operatingHours: string;
    public readonly capacity: number;
    public readonly zones: string[];
    public readonly isActive: boolean;
    public readonly notes: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: GearWarehouseProps) {
        Object.assign(this, props);
    }

    static create(props: GearWarehouseProps): GearWarehouse {
        return new GearWarehouse({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            name: props.name,
            code: props.code,
            type: props.type,
            address: props.address ?? '',
            city: props.city ?? '',
            state: props.state ?? '',
            country: props.country ?? '',
            postalCode: props.postalCode ?? '',
            latitude: props.latitude,
            longitude: props.longitude,
            altitude: props.altitude,
            contactName: props.contactName ?? '',
            contactPhone: props.contactPhone ?? '',
            contactEmail: props.contactEmail ?? '',
            operatingHours: props.operatingHours ?? '',
            capacity: props.capacity ?? 0,
            zones: props.zones ?? [],
            isActive: props.isActive ?? true,
            notes: props.notes ?? '',
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: GearWarehouseProps): GearWarehouse {
        return GearWarehouse.create(data);
    }
}
