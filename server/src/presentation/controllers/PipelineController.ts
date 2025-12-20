import { Request, Response, NextFunction } from 'express';
import { PipelineService } from '../../application/services/PipelineService.js';
import { RequestContext } from '../../shared/types/index.js';

export class PipelineController {
    constructor(private pipelineService: PipelineService) { }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const pipelines = await this.pipelineService.getPipelines(context.tenantId);
            res.status(200).json(pipelines);
        } catch (error) {
            next(error);
        }
    };
}
