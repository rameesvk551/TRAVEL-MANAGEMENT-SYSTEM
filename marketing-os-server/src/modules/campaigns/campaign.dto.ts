import { CampaignType, CampaignChannel, CampaignStatus } from './models/entities/Campaign.js';

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

    leadIds?: string[]; // For static audience
    steps?: {
        stepOrder: number;
        delay: number;
        templateId?: string;
        templateParams?: Record<string, string>;
        content?: string;
        metadata?: Record<string, unknown>;
    }[];
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

    steps?: {
        stepOrder: number;
        delay: number;
        templateId?: string;
        templateParams?: Record<string, string>;
        content?: string;
        metadata?: Record<string, unknown>;
    }[];
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
