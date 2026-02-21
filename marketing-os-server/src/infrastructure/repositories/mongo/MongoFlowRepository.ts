import { IFlow, Flow } from '../../database/mongo/models/Flow.js';
import { IFlowRepository } from '../../../domain/automation/repositories/IFlowRepository.js';

export class MongoFlowRepository implements IFlowRepository {
    async create(flowData: Partial<IFlow>): Promise<IFlow> {
        return await Flow.create(flowData);
    }

    async findAll(tenantId: string): Promise<IFlow[]> {
        return await Flow.find({ tenantId }).sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<IFlow | null> {
        return await Flow.findById(id);
    }

    async update(id: string, flowData: Partial<IFlow>): Promise<IFlow | null> {
        return await Flow.findByIdAndUpdate(id, flowData, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await Flow.findByIdAndDelete(id);
        return !!result;
    }
}
