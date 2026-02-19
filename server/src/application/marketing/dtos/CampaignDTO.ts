import { CampaignType, CampaignChannel, CampaignStatus } from '../../../domain/marketing/entities/Campaign.js';

export interface CreateCampaignDTO {
    tenantId: string;
    name: string;
    type: CampaignType;
    channel: CampaignChannel;

    segmentId?: string;
    tagIds?: string[];
    excludedTagIds?: string[];

    templateId?: string;
    templateParams?: Record<string, string>;
    content?: string;

    scheduledAt?: Date;
    metadata?: Record<string, unknown>;
}

export interface UpdateCampaignDTO {
    name?: string;
    status?: CampaignStatus; // Only generic status updates here

    segmentId?: string;
    tagIds?: string[];
    excludedTagIds?: string[];

    templateId?: string;
    templateParams?: Record<string, string>;
    content?: string;

    scheduledAt?: Date;
    metadata?: Record<string, unknown>;
}

export interface CampaignSummaryDTO {
    id: string;
    name: string;
    status: CampaignStatus;
    stats: {
        sent: number;
        delivered: number;
        read: number;
    };
    scheduledAt?: Date;
}
