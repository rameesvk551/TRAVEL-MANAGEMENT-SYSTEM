import { generateId } from '../../../../shared/utils/index.js';

export interface CampaignStepProps {
    id?: string;
    tenantId: string;
    campaignId: string;
    stepOrder: number;
    delay: number; // In hours (or minutes? Let's assume minutes for granularity, or maybe allow unit selection. Plan said "delay".)
    // Let's stick to minutes for base unit, UI can show hours.

    templateId?: string;
    templateParams?: Record<string, string>;
    content?: string;

    metadata?: Record<string, unknown>;

    createdAt?: Date;
    updatedAt?: Date;
}

export class CampaignStep {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly campaignId: string;
    public stepOrder: number;
    public delay: number;

    public templateId?: string;
    public templateParams: Record<string, string>;
    public content?: string;

    public metadata: Record<string, unknown>;
    public readonly createdAt: Date;
    public updatedAt: Date;

    constructor(props: CampaignStepProps) {
        this.id = props.id!;
        this.tenantId = props.tenantId;
        this.campaignId = props.campaignId;
        this.stepOrder = props.stepOrder;
        this.delay = props.delay;
        this.templateId = props.templateId;
        this.templateParams = props.templateParams || {};
        this.content = props.content;
        this.metadata = props.metadata || {};
        this.createdAt = props.createdAt!;
        this.updatedAt = props.updatedAt!;
    }

    public static create(props: CampaignStepProps): CampaignStep {
        const now = new Date();
        return new CampaignStep({
            id: props.id ?? generateId(),
            ...props,
            templateParams: props.templateParams ?? {},
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }
}
