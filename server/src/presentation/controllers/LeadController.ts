import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../../application/services/LeadService.js';
import { RequestContext } from '../../shared/types/RequestContext.js';
import { ValidationError } from '../../shared/errors/index.js';

export class LeadController {
    constructor(private leadService: LeadService) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const lead = await this.leadService.createLead({
                ...req.body,
                tenantId: context.tenantId, // Force tenant isolation
                assignedToId: req.body.assignedToId || context.userId
            });
            res.status(201).json(lead);
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const result = await this.leadService.getLeads(context.tenantId, {
                ...req.query,
                limit: req.query.limit ? Number(req.query.limit) : 20,
                offset: req.query.offset ? Number(req.query.offset) : 0
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const pipelineId = req.params.pipelineId;
            const leads = await this.leadService.getBoard(context.tenantId, pipelineId);
            res.status(200).json(leads);
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const id = req.params.id;
            const lead = await this.leadService.updateLead(id, context.tenantId, req.body);
            res.status(200).json(lead);
        } catch (error) {
            next(error);
        }
    };

    moveStage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const id = req.params.id;
            const { stageId } = req.body;

            if (!stageId) throw new ValidationError('Stage ID is required');

            const lead = await this.leadService.moveStage(id, context.tenantId, stageId);
            res.status(200).json(lead);
        } catch (error) {
            next(error);
        }
    }
}
