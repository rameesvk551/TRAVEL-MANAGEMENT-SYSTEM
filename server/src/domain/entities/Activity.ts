import { generateId } from '../../shared/utils/index.js';

export type ActivityType = 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'NOTE' | 'TASK' | 'SMS';
export type ActivityStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type ActivityOutcome = 'NO_ANSWER' | 'LEFT_VOICEMAIL' | 'INTERESTED' | 'NOT_INTERESTED' | 'SCHEDULED_FOLLOWUP' | 'BOOKED' | 'OTHER';

export interface ActivityProps {
    id?: string;
    tenantId: string;
    leadId?: string;
    contactId?: string;
    bookingId?: string; // Optional: Link activity to a booking too
    assignedToId?: string; // Staff member
    createdById: string;
    type: ActivityType;
    status?: ActivityStatus;
    outcome?: ActivityOutcome;
    subject: string;
    description?: string;
    scheduledAt?: Date; // For tasks/reminders
    completedAt?: Date;
    metadata?: Record<string, unknown>; // Store message IDs etc.
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Activity Entity - Tracks interactions and tasks for a Lead/Contact.
 * Pure Ops focus: What happened? When? Who did it? What's next?
 */
export class Activity {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly leadId?: string;
    public readonly contactId?: string;
    public readonly bookingId?: string;
    public readonly assignedToId?: string;
    public readonly createdById: string;
    public readonly type: ActivityType;
    public readonly status: ActivityStatus;
    public readonly outcome?: ActivityOutcome;
    public readonly subject: string;
    public readonly description?: string;
    public readonly scheduledAt?: Date;
    public readonly completedAt?: Date;
    public readonly metadata: Record<string, unknown>;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: ActivityProps) {
        this.id = props.id!;
        this.tenantId = props.tenantId;
        this.leadId = props.leadId;
        this.contactId = props.contactId;
        this.bookingId = props.bookingId;
        this.assignedToId = props.assignedToId;
        this.createdById = props.createdById;
        this.type = props.type;
        this.status = props.status!;
        this.outcome = props.outcome;
        this.subject = props.subject;
        this.description = props.description;
        this.scheduledAt = props.scheduledAt;
        this.completedAt = props.completedAt;
        this.metadata = props.metadata!;
        this.createdAt = props.createdAt!;
        this.updatedAt = props.updatedAt!;
    }

    static create(props: ActivityProps): Activity {
        const now = new Date();
        return new Activity({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            leadId: props.leadId,
            contactId: props.contactId,
            bookingId: props.bookingId,
            assignedToId: props.assignedToId,
            createdById: props.createdById,
            type: props.type,
            status: props.status ?? 'PENDING',
            outcome: props.outcome,
            subject: props.subject,
            description: props.description,
            scheduledAt: props.scheduledAt,
            completedAt: props.completedAt,
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    static fromPersistence(data: ActivityProps): Activity {
        return new Activity(data);
    }

    markComplete(outcome: ActivityOutcome, completedBy?: string): Activity {
        // In a pure domain model, we might just return a new instance or mutate.
        // For simplicity reusing defined props.
        // This logic is usually in a Use Case, but domain method is fine for state transition.
        return new Activity({
            ...this,
            status: 'COMPLETED',
            outcome,
            completedAt: new Date(),
            updatedAt: new Date()
        } as ActivityProps);
    }
}
