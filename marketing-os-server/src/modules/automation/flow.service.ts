import { IFlow } from '../../../infrastructure/database/mongo/models/Flow.js';
import { IFlowRepository } from '../../../domain/automation/repositories/IFlowRepository.js';

export class FlowService {
    constructor(private flowRepository: IFlowRepository) { }

    async createFlow(tenantId: string, flowData: Partial<IFlow>): Promise<IFlow> {
        return await this.flowRepository.create({
            ...flowData,
            tenantId,
            isActive: false // Default to inactive
        });
    }

    async getFlows(tenantId: string): Promise<IFlow[]> {
        return await this.flowRepository.findAll(tenantId);
    }

    async getFlow(id: string): Promise<IFlow | null> {
        return await this.flowRepository.findById(id);
    }

    async updateFlow(id: string, flowData: Partial<IFlow>): Promise<IFlow | null> {
        return await this.flowRepository.update(id, flowData);
    }

    async deleteFlow(id: string): Promise<boolean> {
        return await this.flowRepository.delete(id);
    }

    async toggleFlowStatus(id: string, isActive: boolean): Promise<IFlow | null> {
        return await this.flowRepository.update(id, { isActive });
    }
}
