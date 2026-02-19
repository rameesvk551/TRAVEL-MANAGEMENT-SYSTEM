import { Campaign, CampaignStatus } from '../entities/Campaign.js';

export interface CampaignFilters {
    status?: CampaignStatus;
    type?: string;
    channel?: string;
    limit?: number;
    offset?: number;
}

export interface ICampaignRepository {
    save(campaign: Campaign): Promise<Campaign>;
    findById(id: string, tenantId: string): Promise<Campaign | null>;
    findAll(tenantId: string, filters?: CampaignFilters): Promise<{ campaigns: Campaign[]; total: number }>;
    findByStatus(status: CampaignStatus): Promise<Campaign[]>; // For job runner
    delete(id: string, tenantId: string): Promise<void>;
}
