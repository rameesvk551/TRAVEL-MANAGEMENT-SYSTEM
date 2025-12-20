import { generateId } from '../../shared/utils/index.js';

export interface PipelineStage {
    id: string;
    name: string;
    type: 'OPEN' | 'WON' | 'LOST'; // System mapping
    color: string;
    order: number;
    isDefault?: boolean;
}

export interface PipelineProps {
    id?: string;
    tenantId: string;
    name: string;
    isDefault?: boolean;
    stages: PipelineStage[];
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Pipeline Entity - Configurable sales process.
 * Allows tenants to define their own stages (e.g. Enquiry -> Contacted -> Proposal Sent).
 */
export class Pipeline {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly name: string;
    public readonly isDefault: boolean;
    public readonly stages: PipelineStage[];
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: PipelineProps) {
        this.id = props.id!;
        this.tenantId = props.tenantId;
        this.name = props.name;
        this.isDefault = props.isDefault!;
        this.stages = props.stages.sort((a, b) => a.order - b.order);
        this.createdAt = props.createdAt!;
        this.updatedAt = props.updatedAt!;
    }

    static create(props: PipelineProps): Pipeline {
        const now = new Date();
        return new Pipeline({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            name: props.name,
            isDefault: props.isDefault ?? false,
            // Ensure stages have IDs
            stages: props.stages.map(s => ({ ...s, id: s.id ?? generateId() })),
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    static fromPersistence(data: PipelineProps): Pipeline {
        return new Pipeline(data);
    }

    /**
     * Default Travel Pipeline Factory
     */
    static createDefault(tenantId: string): Pipeline {
        return Pipeline.create({
            tenantId,
            name: 'Standard Trek Sales',
            isDefault: true,
            stages: [
                { id: generateId(), name: 'New Enquiry', type: 'OPEN', color: 'blue', order: 1 },
                { id: generateId(), name: 'Contacted', type: 'OPEN', color: 'yellow', order: 2 },
                { id: generateId(), name: 'Interested', type: 'OPEN', color: 'orange', order: 3 },
                { id: generateId(), name: 'Proposal Sent', type: 'OPEN', color: 'purple', order: 4 },
                { id: generateId(), name: 'Negotiation', type: 'OPEN', color: 'pink', order: 5 },
                { id: generateId(), name: 'Booked', type: 'WON', color: 'green', order: 6 },
                { id: generateId(), name: 'Lost', type: 'LOST', color: 'gray', order: 7 },
            ]
        });
    }
}
