import { Request, Response } from 'express';
import { AdminService } from '../modules/admin.js';

const parseIntSafe = (value: unknown, fallback: number) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export class AdminController {
    constructor(private adminService: AdminService) { }

    getOverview = async (_req: Request, res: Response) => {
        try {
            res.json(this.adminService.getOverview());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getTenants = async (req: Request, res: Response) => {
        try {
            const data = this.adminService.getTenants({
                page: parseIntSafe(req.query.page, 1),
                pageSize: parseIntSafe(req.query.pageSize, 10),
                search: String(req.query.search ?? ''),
                status: (req.query.status as any) || 'all',
                plan: (req.query.plan as any) || 'all',
            });
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getTenantById = async (req: Request, res: Response) => {
        try {
            const tenant = this.adminService.getTenantById(req.params.tenantId);
            if (!tenant) {
                res.status(404).json({ error: 'Tenant not found' });
                return;
            }

            res.json(tenant);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    updateTenantStatus = async (req: Request, res: Response) => {
        try {
            const tenant = this.adminService.updateTenantStatus(req.params.tenantId, req.body.status);
            if (!tenant) {
                res.status(404).json({ error: 'Tenant not found' });
                return;
            }

            res.json(tenant);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    updateTenantPlan = async (req: Request, res: Response) => {
        try {
            const tenant = this.adminService.updateTenantPlan(req.params.tenantId, req.body.plan);
            if (!tenant) {
                res.status(404).json({ error: 'Tenant not found' });
                return;
            }

            res.json(tenant);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    impersonateTenant = async (req: Request, res: Response) => {
        try {
            const actorName = typeof req.body?.actorName === 'string' ? req.body.actorName : undefined;
            const session = this.adminService.impersonateTenant(req.params.tenantId, actorName);
            if (!session) {
                res.status(404).json({ error: 'Tenant not found' });
                return;
            }

            res.json(session);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getUsers = async (req: Request, res: Response) => {
        try {
            const data = this.adminService.getUsers({
                page: parseIntSafe(req.query.page, 1),
                pageSize: parseIntSafe(req.query.pageSize, 10),
                search: String(req.query.search ?? ''),
                status: (req.query.status as any) || 'all',
                role: (req.query.role as any) || 'all',
                tenantId: (req.query.tenantId as string) || 'all',
            });
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getUserActivity = async (req: Request, res: Response) => {
        try {
            res.json(this.adminService.getUserActivity(req.params.userId));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getBilling = async (_req: Request, res: Response) => {
        try {
            res.json(this.adminService.getBilling());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getIntegrations = async (_req: Request, res: Response) => {
        try {
            res.json(this.adminService.getIntegrations());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAutomationLogs = async (req: Request, res: Response) => {
        try {
            const data = this.adminService.getAutomationLogs({
                page: parseIntSafe(req.query.page, 1),
                pageSize: parseIntSafe(req.query.pageSize, 10),
                search: String(req.query.search ?? ''),
                status: (req.query.status as any) || 'all',
            });
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAuditLogs = async (req: Request, res: Response) => {
        try {
            const data = this.adminService.getAuditLogs({
                page: parseIntSafe(req.query.page, 1),
                pageSize: parseIntSafe(req.query.pageSize, 12),
                search: String(req.query.search ?? ''),
                category: (req.query.category as any) || 'all',
            });
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getSystemHealth = async (_req: Request, res: Response) => {
        try {
            res.json(this.adminService.getSystemHealth());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getFeatureManagement = async (_req: Request, res: Response) => {
        try {
            res.json(this.adminService.getFeatureManagement());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    updatePlanFeature = async (req: Request, res: Response) => {
        try {
            const { featureKey, enabled } = req.body;
            res.json(this.adminService.updatePlanFeature(req.params.planId, featureKey, Boolean(enabled)));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    updatePlanLimit = async (req: Request, res: Response) => {
        try {
            const { field, value } = req.body;
            res.json(this.adminService.updatePlanLimit(req.params.planId, field, Number(value)));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    updateFeatureFlag = async (req: Request, res: Response) => {
        try {
            const { enabled, rolloutPercentage } = req.body;
            res.json(this.adminService.updateFeatureFlag(req.params.flagId, Boolean(enabled), Number(rolloutPercentage)));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getSettings = async (_req: Request, res: Response) => {
        try {
            res.json(this.adminService.getSettings());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    updateSettings = async (req: Request, res: Response) => {
        try {
            res.json(this.adminService.updateSettings(req.body));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getNotifications = async (_req: Request, res: Response) => {
        try {
            res.json(this.adminService.getNotifications());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    markNotificationRead = async (req: Request, res: Response) => {
        try {
            res.json(this.adminService.markNotificationRead(req.params.id));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
