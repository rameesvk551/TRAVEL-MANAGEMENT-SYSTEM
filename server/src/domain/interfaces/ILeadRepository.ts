import { Lead } from '../entities/Lead.js';
import { Pagination } from '../../shared/types/Pagination.js';

export interface LeadFilters extends Pagination {
    pipelineId?: string;
    stageId?: string;
    assignedToId?: string;
    search?: string;
    priority?: string;
    tags?: string[];
    dateRange?: { start: Date; end: Date }; // Creation date range
}

export interface ILeadRepository {
    save(lead: Lead): Promise<Lead>;
    findById(id: string, tenantId: string): Promise<Lead | null>;
    findAll(tenantId: string, filters: LeadFilters): Promise<{ leads: Lead[]; total: number }>;
    findByPipeline(pipelineId: string, tenantId: string): Promise<Lead[]>; // For board view (no pagination usually, or huge limit)
    countByStage(pipelineId: string, tenantId: string): Promise<Record<string, number>>;
    delete(id: string, tenantId: string): Promise<void>;
}
