import { Visitor } from '../entities/Visitor.js';

export interface VisitorFilters {
    country?: string;
    deviceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface IVisitorRepository {
    save(visitor: Visitor): Promise<Visitor>;
    findById(id: string, tenantId: string): Promise<Visitor | null>;
    findByFingerprint(fingerprint: string, tenantId: string): Promise<Visitor | null>;
    findAll(tenantId: string, filters?: VisitorFilters): Promise<{ visitors: Visitor[]; total: number }>;
    countByDateRange(tenantId: string, start: Date, end: Date): Promise<number>;
    countByCountry(tenantId: string, start: Date, end: Date): Promise<Array<{ country: string; count: number }>>;
    countByDevice(tenantId: string, start: Date, end: Date): Promise<Array<{ deviceType: string; count: number }>>;
}
