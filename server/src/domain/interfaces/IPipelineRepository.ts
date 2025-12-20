import { Pipeline } from '../entities/Pipeline.js';

export interface IPipelineRepository {
    save(pipeline: Pipeline): Promise<Pipeline>;
    findById(id: string, tenantId: string): Promise<Pipeline | null>;
    findAll(tenantId: string): Promise<Pipeline[]>;
    getDefault(tenantId: string): Promise<Pipeline | null>;
    delete(id: string, tenantId: string): Promise<void>;
}
