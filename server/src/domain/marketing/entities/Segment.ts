import { generateId } from '../../../shared/utils/index.js';

export interface SegmentFilter {
    field: string; // e.g. "tags", "score", "source", "travelPreferences.budget"
    operator: 'EQUALS' | 'CONTAINS' | 'GT' | 'LT' | 'IN' | 'NOT_IN';
    value: any;
}

export interface SegmentProps {
    id?: string;
    tenantId: string;
    name: string;
    description?: string;
    filters: SegmentFilter[]; // AND logic by default
    isDynamic: boolean; // If false, it's a static snapshot? Usually segments are dynamic.

    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Segment {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly name: string;
    public readonly description?: string;
    public readonly filters: SegmentFilter[];
    public readonly isDynamic: boolean;

    public readonly metadata: Record<string, unknown>;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(props: SegmentProps) {
        this.id = props.id!;
        this.tenantId = props.tenantId;
        this.name = props.name;
        this.description = props.description;
        this.filters = props.filters;
        this.isDynamic = props.isDynamic;
        this.metadata = props.metadata || {};
        this.createdAt = props.createdAt!;
        this.updatedAt = props.updatedAt!;
    }

    public static create(props: SegmentProps): Segment {
        const now = new Date();
        return new Segment({
            id: props.id ?? generateId(),
            ...props,
            filters: props.filters ?? [],
            isDynamic: props.isDynamic ?? true,
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    public static fromPersistence(data: SegmentProps): Segment {
        return new Segment(data);
    }
}
