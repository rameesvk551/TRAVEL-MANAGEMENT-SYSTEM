import { Lead } from '../../campaigns/models/entities/Lead.js';

export interface ILeadRepository {
    findById(id: string, tenantId: string): Promise<Lead | null>;
    findAll(tenantId: string, options?: any): Promise<{ leads: Lead[], total: number }>;
    save(lead: Lead): Promise<Lead>;
}
