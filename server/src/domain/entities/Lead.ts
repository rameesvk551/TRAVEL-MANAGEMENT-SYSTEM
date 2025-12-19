import { generateId } from '../../shared/utils/index.js';

export type LeadStatus =
    | 'new'
    | 'contacted'
    | 'qualified'
    | 'proposal'
    | 'negotiation'
    | 'won'
    | 'lost';

export interface LeadProps {
    id?: string;
    tenantId: string;
    assignedToId?: string;
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    status?: LeadStatus;
    score?: number;
    inquiryDetails?: Record<string, unknown>;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Lead entity - represents a potential customer in the CRM pipeline.
 */
export class Lead {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly assignedToId?: string;
    public readonly name: string;
    public readonly email?: string;
    public readonly phone?: string;
    public readonly source?: string;
    public readonly status: LeadStatus;
    public readonly score: number;
    public readonly inquiryDetails: Record<string, unknown>;
    public readonly notes?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<Omit<LeadProps, 'assignedToId' | 'email' | 'phone' | 'source' | 'notes'>> & Pick<LeadProps, 'assignedToId' | 'email' | 'phone' | 'source' | 'notes'>) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.assignedToId = props.assignedToId;
        this.name = props.name;
        this.email = props.email;
        this.phone = props.phone;
        this.source = props.source;
        this.status = props.status;
        this.score = props.score;
        this.inquiryDetails = props.inquiryDetails;
        this.notes = props.notes;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: LeadProps): Lead {
        const now = new Date();
        return new Lead({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            assignedToId: props.assignedToId,
            name: props.name,
            email: props.email,
            phone: props.phone,
            source: props.source,
            status: props.status ?? 'new',
            score: props.score ?? 0,
            inquiryDetails: props.inquiryDetails ?? {},
            notes: props.notes,
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    static fromPersistence(data: LeadProps): Lead {
        return Lead.create(data);
    }
}
