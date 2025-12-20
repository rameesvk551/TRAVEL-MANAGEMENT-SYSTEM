import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../../application/services/ActivityService.js';
import { RequestContext } from '../../shared/types/RequestContext.js';

export class ActivityController {
    constructor(private activityService: ActivityService) { }

    log = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const activity = await this.activityService.logActivity({
                ...req.body,
                tenantId: context.tenantId,
                createdById: context.userId
            });
            res.status(201).json(activity);
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const result = await this.activityService.getActivities(context.tenantId, {
                ...req.query,
                limit: req.query.limit ? Number(req.query.limit) : 20,
                offset: req.query.offset ? Number(req.query.offset) : 0
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}
