import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../../application/services/DashboardService.js';
import { RequestContext } from '../../shared/types/index.js';

export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const branchId = req.query.branchId as string | undefined;
            const stats = await this.dashboardService.getStats(context.tenantId, branchId);
            res.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    };
}
