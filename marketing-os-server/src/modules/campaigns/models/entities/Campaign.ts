import { generateId } from '../../../../shared/utils/index.js';
import { CampaignStep } from './CampaignStep.js';

export type CampaignType = 'BROADCAST' | 'DRIP' | 'TRIGGERED';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
export type CampaignChannel = 'WHATSAPP' | 'EMAIL';

export interface CampaignProps {
    id?: string;
    tenantId: string;
    name: string;
    type: CampaignType;
    channel: CampaignChannel;
    status?: CampaignStatus;

    // Who to send to?
    segmentId?: string; // Dynamic list
    tagIds?: string[]; // Static tags
    excludedTagIds?: string[];

    // What to send?
    templateId?: string; // WhatsApp Template ID (MessageTemplate)
    templateParams?: Record<string, string>; // { "1": "firstName" } mapping
    content?: string; // For Email/Freeform

    // When?
    scheduledAt?: Date;

    // Stats (Snapshot)
    totalLeads?: number;
    sentCount?: number;
    deliveredCount?: number;
    readCount?: number;
    repliedCount?: number;
    failedCount?: number;

    metadata?: Record<string, unknown>;

    steps?: CampaignStep[];

    createdAt?: Date;
    updatedAt?: Date;
}

export class Campaign {
    public readonly id: string;
    public readonly tenantId: string;
    public name: string;
    public readonly type: CampaignType;
    public readonly channel: CampaignChannel;
    public status: CampaignStatus;

    public segmentId?: string;
    public tagIds: string[];
    public excludedTagIds: string[];

    public templateId?: string;
    public templateParams: Record<string, string>;
    public content?: string;

    public scheduledAt?: Date;

    public totalLeads: number;
    public sentCount: number;
    public deliveredCount: number;
    public readCount: number;
    public repliedCount: number;
    public failedCount: number;

    public metadata: Record<string, unknown>;
    public steps: CampaignStep[];
    public readonly createdAt: Date;
    public updatedAt: Date;

    constructor(props: CampaignProps) {
        this.id = props.id!;
        this.tenantId = props.tenantId;
        this.name = props.name;
        this.type = props.type;
        this.channel = props.channel;
        this.status = props.status ?? 'DRAFT';
        this.segmentId = props.segmentId;
        this.tagIds = props.tagIds || [];
        this.excludedTagIds = props.excludedTagIds || [];
        this.templateId = props.templateId;
        this.templateParams = props.templateParams || {};
        this.content = props.content;
        this.scheduledAt = props.scheduledAt;
        this.totalLeads = props.totalLeads || 0;
        this.sentCount = props.sentCount || 0;
        this.deliveredCount = props.deliveredCount || 0;
        this.readCount = props.readCount || 0;
        this.repliedCount = props.repliedCount || 0;
        this.failedCount = props.failedCount || 0;
        this.metadata = props.metadata || {};
        this.steps = props.steps || [];
        this.createdAt = props.createdAt!;
        this.updatedAt = props.updatedAt!;
    }

    public static create(props: CampaignProps): Campaign {
        const now = new Date();
        return new Campaign({
            id: props.id ?? generateId(),
            ...props,
            status: props.status ?? 'DRAFT',
            tagIds: props.tagIds ?? [],
            excludedTagIds: props.excludedTagIds ?? [],
            templateParams: props.templateParams ?? {},
            totalLeads: props.totalLeads ?? 0,
            sentCount: props.sentCount ?? 0,
            deliveredCount: props.deliveredCount ?? 0,
            readCount: props.readCount ?? 0,
            repliedCount: props.repliedCount ?? 0,
            failedCount: props.failedCount ?? 0,
            metadata: props.metadata ?? {},
            steps: props.steps ?? [],
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    public static fromPersistence(data: CampaignProps): Campaign {
        return new Campaign(data);
    }

    public get isEditable(): boolean {
        return this.status === 'DRAFT' || this.status === 'SCHEDULED' || this.status === 'PAUSED';
    }
}
