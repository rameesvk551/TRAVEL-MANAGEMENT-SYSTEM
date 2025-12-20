import { generateId } from '../../shared/utils/index.js';

export interface LeadTravelPreferences {
    startDate?: Date;
    endDate?: Date;
    flexibleDates?: boolean;
    groupSizeAdults?: number;
    groupSizeChildren?: number;
    budget?: number;
    budgetCurrency?: string;
    interestedActivities?: string[]; // IDs or names
    difficultyLevel?: 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME';
    accommodationType?: 'HOTEL' | 'CAMPING' | 'HOMESTAY';
}

export interface LeadProps {
    id?: string;
    tenantId: string;
    pipelineId?: string; // Which workflow
    stageId?: string; // Which step

    // Identity
    contactId?: string; // Link to unified contact
    name: string; // Fallback if no contact
    email?: string;
    phone?: string;

    assignedToId?: string; // Sales rep
    source?: string; // Meta, Google, Walk-in
    sourcePlatform?: string;

    // Travel specific logic
    travelPreferences?: LeadTravelPreferences;

    // Ops
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status?: string; // DEPRECATED: Use stageId. Kept for back-compat or quick checks.
    score?: number;
    tags?: string[];

    // Notes & Meta
    notes?: string;
    lostReason?: string;
    metadata?: Record<string, unknown>;

    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Lead entity - represents a tangible sales opportunity.
 * Linked to a Contact (Human) and a Pipeline Stage (Process).
 */
export class Lead {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly pipelineId?: string;
    public readonly stageId?: string;

    public readonly contactId?: string;
    public readonly name: string;
    public readonly email?: string;
    public readonly phone?: string;

    public readonly assignedToId?: string;
    public readonly source?: string;
    public readonly sourcePlatform?: string;

    public readonly travelPreferences: LeadTravelPreferences;

    public readonly priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    public readonly status?: string;
    public readonly score: number;
    public readonly tags: string[];

    public readonly notes?: string;
    public readonly lostReason?: string;
    public readonly metadata: Record<string, unknown>;

    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: LeadProps) {
        this.id = props.id!;
        this.tenantId = props.tenantId;
        this.pipelineId = props.pipelineId;
        this.stageId = props.stageId;
        this.contactId = props.contactId;
        this.name = props.name;
        this.email = props.email;
        this.phone = props.phone;
        this.assignedToId = props.assignedToId;
        this.source = props.source;
        this.sourcePlatform = props.sourcePlatform;
        this.travelPreferences = props.travelPreferences!;
        this.priority = props.priority!;
        this.status = props.status;
        this.score = props.score!;
        this.tags = props.tags!;
        this.notes = props.notes;
        this.lostReason = props.lostReason;
        this.metadata = props.metadata!;
        this.createdAt = props.createdAt!;
        this.updatedAt = props.updatedAt!;
    }

    static create(props: LeadProps): Lead {
        const now = new Date();
        return new Lead({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            pipelineId: props.pipelineId,
            stageId: props.stageId,
            contactId: props.contactId,
            name: props.name,
            email: props.email,
            phone: props.phone,
            assignedToId: props.assignedToId,
            source: props.source,
            sourcePlatform: props.sourcePlatform,
            travelPreferences: props.travelPreferences ?? {},
            priority: props.priority ?? 'MEDIUM',
            status: props.status,
            score: props.score ?? 0,
            tags: props.tags ?? [],
            notes: props.notes,
            lostReason: props.lostReason,
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    static fromPersistence(data: LeadProps): Lead {
        return new Lead(data);
    }
}
