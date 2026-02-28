import { Request, Response } from 'express';
import { FunnelAnalyticsService } from '../modules/growth.js';

export class FunnelController {
    constructor(private funnelService: FunnelAnalyticsService) { }

    /**
     * POST /funnels — Create a new funnel
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = (req as any).tenantId || 'default';
            const { name, description, steps } = req.body;

            if (!name || !steps || !Array.isArray(steps) || steps.length < 2) {
                res.status(400).json({ success: false, error: 'Funnel requires a name and at least 2 steps' });
                return;
            }

            const funnel = await this.funnelService.createFunnel({ tenantId, name, description, steps });
            res.status(201).json({ success: true, data: funnel });
        } catch (error: any) {
            console.error('[FunnelController] Error creating funnel:', error.message);
            res.status(500).json({ success: false, error: 'Failed to create funnel' });
        }
    };

    /**
     * GET /funnels — List all funnels for the tenant
     */
    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = (req as any).tenantId || 'default';
            const funnels = await this.funnelService.listFunnels(tenantId);
            res.json({ success: true, data: funnels });
        } catch (error: any) {
            console.error('[FunnelController] Error listing funnels:', error.message);
            res.status(500).json({ success: false, error: 'Failed to list funnels' });
        }
    };

    /**
     * GET /funnels/:id — Get funnel details
     */
    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const funnel = await this.funnelService.getFunnel(req.params.id);
            if (!funnel) {
                res.status(404).json({ success: false, error: 'Funnel not found' });
                return;
            }
            res.json({ success: true, data: funnel });
        } catch (error: any) {
            console.error('[FunnelController] Error getting funnel:', error.message);
            res.status(500).json({ success: false, error: 'Failed to get funnel' });
        }
    };

    /**
     * PUT /funnels/:id — Update a funnel
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const funnel = await this.funnelService.updateFunnel(req.params.id, req.body);
            if (!funnel) {
                res.status(404).json({ success: false, error: 'Funnel not found' });
                return;
            }
            res.json({ success: true, data: funnel });
        } catch (error: any) {
            console.error('[FunnelController] Error updating funnel:', error.message);
            res.status(500).json({ success: false, error: 'Failed to update funnel' });
        }
    };

    /**
     * DELETE /funnels/:id — Delete a funnel
     */
    remove = async (req: Request, res: Response): Promise<void> => {
        try {
            const deleted = await this.funnelService.deleteFunnel(req.params.id);
            if (!deleted) {
                res.status(404).json({ success: false, error: 'Funnel not found' });
                return;
            }
            res.json({ success: true, message: 'Funnel deleted' });
        } catch (error: any) {
            console.error('[FunnelController] Error deleting funnel:', error.message);
            res.status(500).json({ success: false, error: 'Failed to delete funnel' });
        }
    };

    /**
     * GET /funnels/:id/analyze — Analyze funnel drop-off
     * Query: ?start=2024-01-01&end=2024-12-31
     */
    analyze = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = (req as any).tenantId || 'default';
            const endDate = req.query.end ? new Date(req.query.end as string) : new Date();
            const startDate = req.query.start
                ? new Date(req.query.start as string)
                : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

            const result = await this.funnelService.analyzeFunnel(tenantId, req.params.id, startDate, endDate);

            if (!result.funnel) {
                res.status(404).json({ success: false, error: 'Funnel not found' });
                return;
            }

            res.json({ success: true, data: result });
        } catch (error: any) {
            console.error('[FunnelController] Error analyzing funnel:', error.message);
            res.status(500).json({ success: false, error: 'Failed to analyze funnel' });
        }
    };
}
