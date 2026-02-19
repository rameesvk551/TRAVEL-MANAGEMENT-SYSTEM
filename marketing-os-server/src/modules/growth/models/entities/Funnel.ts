import { generateId } from '../../../shared/utils/index.js';

export interface FunnelStep {
    name: string;
    eventType: string;
    eventName?: string;
    url?: string;
}

export interface FunnelProps {
    id?: string;
    tenantId: string;
    name: string;
    description?: string;
    steps: FunnelStep[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Funnel {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly name: string;
    public readonly description: string;
    public readonly steps: FunnelStep[];
    public readonly isActive: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<FunnelProps>) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.name = props.name;
        this.description = props.description;
        this.steps = props.steps;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: FunnelProps): Funnel {
        return new Funnel({
            id: props.id || generateId(),
            tenantId: props.tenantId,
            name: props.name,
            description: props.description || '',
            steps: props.steps,
            isActive: props.isActive ?? true,
            createdAt: props.createdAt || new Date(),
            updatedAt: props.updatedAt || new Date(),
        });
    }

    static fromPersistence(props: Required<FunnelProps>): Funnel {
        return new Funnel(props);
    }
}
