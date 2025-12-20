import { Pipeline, PipelineProps } from '../../domain/entities/Pipeline.js';
import { PipelineRepository } from '../../infrastructure/repositories/PipelineRepository.js';

export class PipelineService {
    constructor(private pipelineRepository: PipelineRepository) { }

    async getPipelines(tenantId: string): Promise<Pipeline[]> {
        let pipelines = await this.pipelineRepository.findAll(tenantId);
        if (pipelines.length === 0) {
            // Auto-create default if none exist
            const defaultPipeline = Pipeline.createDefault(tenantId);
            await this.pipelineRepository.save(defaultPipeline);
            pipelines = [defaultPipeline];
        }
        return pipelines;
    }

    async createPipeline(props: PipelineProps): Promise<Pipeline> {
        const pipeline = Pipeline.create(props);
        return this.pipelineRepository.save(pipeline);
    }

    async getPipeline(id: string, tenantId: string): Promise<Pipeline | null> {
        return this.pipelineRepository.findById(id, tenantId);
    }
}
