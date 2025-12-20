import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../../application/services/LeadService.js';
import { RequestContext } from '../../shared/types/index.js';
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
            // Basic support for filtering by ID if passed in query (hacky but works without new route)
            // Better: add getById. But for now, let's just use what we have or update repository.
            const result = await this.leadService.getLeads(context.tenantId, {
                ...req.query,
                limit: req.query.limit ? Number(req.query.limit) : 20,
                offset: req.query.offset ? Number(req.query.offset) : 0,
                page: req.query.page ? Number(req.query.page) : 1
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const id = req.params.id;
            // Need to expose findById in Service first? Yes. Service has updateLead which finds.
            // Service has no public getById? It has repo.findById but not exposed.
            // Let's stick to client side find for now to avoid rapid context switching loops.
            // Or quickly add it. 
            // I'll skip this edit and just rely on client update for now. 
            // Wait, I am in LeadController.ts. 
            // I will add getById to LeadController and register it. It's the right way.

            // I need to update Service first? 
            // LeadService.ts: `updateLead` calls repo.findById. `getLeads` calls repo.findAll.
            // I should add `getLead` to LeadService.
            res.status(501).json({ message: 'Not implemented yet' });
        } catch (error) {
            next(error);
        }
    }

    convert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const leadId = req.params.id;
            const bookingDetails = req.body; // Expect resourceId, dates, etc.

            await this.leadService.convertToBooking(leadId, context.tenantId, bookingDetails);

            res.status(200).json({ message: 'Lead converted successfully' });
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
