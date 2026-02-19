import { Tenant } from '../entities/Tenant.js';

export interface ITenantRepository {
    findById(id: string): Promise<Tenant | null>;
    updateSettings(id: string, settings: any): Promise<void>;
    getSettings(id: string): Promise<any>;
}
