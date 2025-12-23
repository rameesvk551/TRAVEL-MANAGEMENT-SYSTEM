import { generateId } from '../../../shared/utils/index.js';

/**
 * Gear category types - comprehensive outdoor equipment classification
 */
export type GearCategoryType =
    | 'SHELTER'        // Tents, tarps, bivys
    | 'SLEEPING'       // Sleeping bags, pads, liners
    | 'CLOTHING'       // Jackets, boots, layers
    | 'CLIMBING'       // Ropes, harnesses, carabiners
    | 'SAFETY'         // Oxygen, first aid, radios
    | 'NAVIGATION'     // GPS, maps, compasses
    | 'COOKING'        // Stoves, pots, utensils
    | 'LIGHTING'       // Headlamps, lanterns
    | 'TRANSPORT'      // Backpacks, duffels
    | 'TECHNICAL'      // Ice axes, crampons
    | 'COMMUNICATION'  // Radios, satellite phones
    | 'MEDICAL'        // First aid, oxygen cylinders
    | 'FURNITURE'      // Camping chairs, tables
    | 'POWER'          // Batteries, solar panels
    | 'OTHER';

export interface GearCategoryProps {
    id?: string;
    tenantId: string;
    name: string;
    type: GearCategoryType;
    parentId?: string;
    description?: string;
    isSafetyCritical: boolean;
    inspectionIntervalDays?: number;
    maintenanceIntervalDays?: number;
    attributes?: Record<string, unknown>;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * GearCategory entity - defines hierarchical gear classification.
 * Supports safety-critical flagging and inspection schedules.
 */
export class GearCategory {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly name: string;
    public readonly type: GearCategoryType;
    public readonly parentId?: string;
    public readonly description: string;
    public readonly isSafetyCritical: boolean;
    public readonly inspectionIntervalDays: number;
    public readonly maintenanceIntervalDays: number;
    public readonly attributes: Record<string, unknown>;
    public readonly isActive: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<Omit<GearCategoryProps, 'parentId'>> & Pick<GearCategoryProps, 'parentId'>) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.name = props.name;
        this.type = props.type;
        this.parentId = props.parentId;
        this.description = props.description;
        this.isSafetyCritical = props.isSafetyCritical;
        this.inspectionIntervalDays = props.inspectionIntervalDays;
        this.maintenanceIntervalDays = props.maintenanceIntervalDays;
        this.attributes = props.attributes;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: GearCategoryProps): GearCategory {
        return new GearCategory({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            name: props.name,
            type: props.type,
            parentId: props.parentId,
            description: props.description ?? '',
            isSafetyCritical: props.isSafetyCritical,
            inspectionIntervalDays: props.inspectionIntervalDays ?? 90,
            maintenanceIntervalDays: props.maintenanceIntervalDays ?? 180,
            attributes: props.attributes ?? {},
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: Required<Omit<GearCategoryProps, 'parentId'>> & Pick<GearCategoryProps, 'parentId'>): GearCategory {
        return new GearCategory(data);
    }
}
