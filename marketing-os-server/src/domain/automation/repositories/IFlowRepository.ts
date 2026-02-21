import { IFlow } from '../../../infrastructure/database/mongo/models/Flow.js';

export interface IFlowRepository {
    create(flow: Partial<IFlow>): Promise<IFlow>;
    findAll(tenantId: string): Promise<IFlow[]>;
    findById(id: string): Promise<IFlow | null>;
    update(id: string, flow: Partial<IFlow>): Promise<IFlow | null>;
    delete(id: string): Promise<boolean>;
}
