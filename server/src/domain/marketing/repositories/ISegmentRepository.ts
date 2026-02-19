import { Segment } from '../entities/Segment.js';

export interface ISegmentRepository {
    save(segment: Segment): Promise<Segment>;
    findById(id: string, tenantId: string): Promise<Segment | null>;
    findAll(tenantId: string): Promise<Segment[]>;
    delete(id: string, tenantId: string): Promise<void>;
}
