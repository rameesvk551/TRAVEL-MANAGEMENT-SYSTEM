/**
 * Automation controller — handles HTTP request/response only.
 */

import { Request, Response } from 'express';
import { AutomationService } from './automation.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/apiError.js';

export class AutomationController {
    constructor(private readonly automationService: AutomationService) {}

    // ============================
    // RULE CRUD
    // ============================

    getRules = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { is_active, trigger_type, search, limit, offset } = req.query;

        const result = await this.automationService.getRules(tenantId, {
            is_active: is_active !== undefined ? is_active === 'true' : undefined,
            trigger_type: trigger_type as any,
            search: search as string,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        });

        ApiResponse.success(res, result);
    });

    getRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const rule = await this.automationService.getRule(tenantId, req.params.id);
        if (!rule) throw new AppError('Rule not found', 404);

        ApiResponse.success(res, { rule });
    });

    createRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const rule = await this.automationService.createRule(tenantId, req.body);

        ApiResponse.created(res, { rule });
    });

    updateRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const rule = await this.automationService.updateRule(tenantId, req.params.id, req.body);
        if (!rule) throw new AppError('Rule not found', 404);

        ApiResponse.success(res, { rule });
    });

    deleteRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const deleted = await this.automationService.deleteRule(tenantId, req.params.id);
        if (!deleted) throw new AppError('Rule not found', 404);

        ApiResponse.success(res, { success: true });
    });

    // ============================
    // RULE ACTIONS
    // ============================

    activateRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const rule = await this.automationService.activateRule(tenantId, req.params.id);
        if (!rule) throw new AppError('Rule not found', 404);

        ApiResponse.success(res, { rule });
    });

    deactivateRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const rule = await this.automationService.deactivateRule(tenantId, req.params.id);
        if (!rule) throw new AppError('Rule not found', 404);

        ApiResponse.success(res, { rule });
    });

    // ============================
    // EXECUTIONS
    // ============================

    getExecution = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const execution = await this.automationService.getExecution(tenantId, req.params.id);
        if (!execution) throw new AppError('Execution not found', 404);

        ApiResponse.success(res, { execution });
    });

    // ============================
    // STATISTICS
    // ============================

    getStats = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { start_date, end_date } = req.query;
        const startDate = start_date ? new Date(start_date as string) : undefined;
        const endDate = end_date ? new Date(end_date as string) : undefined;

        const stats = await this.automationService.getStats(tenantId, startDate, endDate);

        ApiResponse.success(res, { stats });
    });

    // ============================
    // TEMPLATES
    // ============================

    createDefaultRules = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const rules = await this.automationService.createDefaultRules(tenantId);

        ApiResponse.created(res, { rules });
    });
}
