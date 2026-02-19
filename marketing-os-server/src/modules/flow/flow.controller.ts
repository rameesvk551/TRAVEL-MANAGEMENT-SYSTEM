/**
 * Flow controller — handles HTTP request/response only.
 * All business logic is in FlowService.
 */

import { Request, Response } from 'express';
import { FlowService } from './flow.service.js';
import { FlowEngine } from './flow.engine.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/apiError.js';

export class FlowController {
    constructor(
        private readonly flowService: FlowService,
        private readonly flowEngine: FlowEngine,
    ) {}

    // ============================
    // FLOW CRUD
    // ============================

    getFlows = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { is_active, trigger_type, search, limit, offset } = req.query;

        const result = await this.flowService.getFlows(tenantId, {
            is_active: is_active !== undefined ? is_active === 'true' : undefined,
            trigger_type: trigger_type as any,
            search: search as string,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        });

        ApiResponse.success(res, result);
    });

    getFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const flow = await this.flowService.getFlow(tenantId, req.params.id);
        if (!flow) throw new AppError('Flow not found', 404);

        ApiResponse.success(res, { flow });
    });

    createFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { name, description, trigger_keywords, trigger_type, is_active, is_default, priority, nodes, start_node_id, metadata } = req.body;

        if (!name) throw new AppError('Name is required', 400);
        if (!nodes || !Array.isArray(nodes)) throw new AppError('Nodes array is required', 400);
        if (!start_node_id) throw new AppError('start_node_id is required', 400);

        const flow = await this.flowService.createFlow(tenantId, {
            name,
            description,
            trigger_keywords,
            trigger_type,
            is_active,
            is_default,
            priority,
            nodes,
            start_node_id,
            metadata,
        });

        ApiResponse.created(res, { flow });
    });

    updateFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const flow = await this.flowService.updateFlow(tenantId, req.params.id, req.body);
        if (!flow) throw new AppError('Flow not found', 404);

        ApiResponse.success(res, { flow });
    });

    deleteFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const deleted = await this.flowService.deleteFlow(tenantId, req.params.id);
        if (!deleted) throw new AppError('Flow not found', 404);

        ApiResponse.success(res, { success: true });
    });

    duplicateFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { name } = req.body;
        if (!name) throw new AppError('New name is required', 400);

        const flow = await this.flowService.duplicateFlow(tenantId, req.params.id, name);
        if (!flow) throw new AppError('Flow not found', 404);

        ApiResponse.created(res, { flow });
    });

    // ============================
    // FLOW ACTIVATION
    // ============================

    activateFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const flow = await this.flowService.activateFlow(tenantId, req.params.id);
        if (!flow) throw new AppError('Flow not found', 404);

        ApiResponse.success(res, { flow });
    });

    deactivateFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const flow = await this.flowService.deactivateFlow(tenantId, req.params.id);
        if (!flow) throw new AppError('Flow not found', 404);

        ApiResponse.success(res, { flow });
    });

    // ============================
    // FLOW EXECUTION (Manual Trigger)
    // ============================

    triggerFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { phone } = req.body;
        if (!phone) throw new AppError('Phone is required', 400);

        const result = await this.flowEngine.triggerFlow(tenantId, phone, req.params.id);
        if (!result) throw new AppError('Flow not found', 404);

        ApiResponse.success(res, { result });
    });

    // ============================
    // SESSION MANAGEMENT
    // ============================

    getActiveSession = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { phone } = req.params;
        if (!phone) throw new AppError('Phone is required', 400);

        const session = await this.flowService.getActiveSession(tenantId, phone);

        ApiResponse.success(res, { session });
    });

    endSession = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { phone } = req.params;
        if (!phone) throw new AppError('Phone is required', 400);

        await this.flowEngine.endActiveSession(tenantId, phone);

        ApiResponse.success(res, { success: true });
    });

    getSessionsNeedingFollowUp = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const minutes = req.query.minutes ? parseInt(req.query.minutes as string) : 30;
        const sessions = await this.flowService.getSessionsNeedingFollowUp(tenantId, minutes);

        ApiResponse.success(res, { sessions });
    });

    // ============================
    // ANALYTICS
    // ============================

    getFlowAnalytics = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { start_date, end_date } = req.query;
        const startDate = start_date ? new Date(start_date as string) : undefined;
        const endDate = end_date ? new Date(end_date as string) : undefined;

        const analytics = await this.flowService.getFlowAnalytics(tenantId, req.params.id, startDate, endDate);
        if (!analytics) throw new AppError('Flow not found', 404);

        ApiResponse.success(res, { analytics });
    });

    // ============================
    // TEMPLATES
    // ============================

    createDefaultFlow = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const flow = await this.flowService.createDefaultQualificationFlow(tenantId);

        ApiResponse.created(res, { flow });
    });
}
