import { Request, Response } from 'express';
import { RevenueService } from '../modules/revenue';

export class RevenueController {
    constructor(private revenueService: RevenueService) { }

    getDashboard = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const start = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString());
            const end = new Date(req.query.end as string || new Date().toISOString());
            const dashboard = await this.revenueService.getDashboard(tenantId, start, end);
            res.json(dashboard);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getMRR = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const mrr = await this.revenueService.getMRR(tenantId);
            const arr = await this.revenueService.getARR(tenantId);
            res.json({ mrr, arr });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getChurn = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const start = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString());
            const end = new Date(req.query.end as string || new Date().toISOString());
            const churnRate = await this.revenueService.getChurnRate(tenantId, start, end);
            res.json({ churnRate });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getTrialConversion = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const start = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString());
            const end = new Date(req.query.end as string || new Date().toISOString());
            const data = await this.revenueService.getTrialConversion(tenantId, start, end);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getRevenueTrend = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const start = new Date(req.query.start as string || new Date(Date.now() - 90 * 86400000).toISOString());
            const end = new Date(req.query.end as string || new Date().toISOString());
            const trend = await this.revenueService.getRevenueTrend(tenantId, start, end);
            res.json({ trend });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getRevenueByChannel = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const start = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString());
            const end = new Date(req.query.end as string || new Date().toISOString());
            const data = await this.revenueService.getRevenueByChannel(tenantId, start, end);
            res.json({ channels: data });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getRefunds = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const start = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString());
            const end = new Date(req.query.end as string || new Date().toISOString());
            const data = await this.revenueService.getRefundStats(tenantId, start, end);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getPaymentFailures = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const start = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString());
            const end = new Date(req.query.end as string || new Date().toISOString());
            const data = await this.revenueService.getPaymentFailures(tenantId, start, end);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getRevenueForecast = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const months = parseInt(req.query.months as string || '12', 10);
            const forecast = await this.revenueService.getRevenueForecast(tenantId, months);
            res.json({ forecast });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getProfitMargin = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const start = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString());
            const end = new Date(req.query.end as string || new Date().toISOString());
            const data = await this.revenueService.getProfitMargin(tenantId, start, end);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
