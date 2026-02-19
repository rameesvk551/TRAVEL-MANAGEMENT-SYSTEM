/**
 * Lead controller — handles HTTP request/response only.
 * All business logic is in LeadService.
 */

import { Request, Response } from 'express';
import { LeadService } from './lead.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/apiError.js';

export class LeadController {
    constructor(private readonly leadService: LeadService) {}

    // ============================
    // LEAD CRUD
    // ============================

    getLeads = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { status, source, assigned_to, tags, search, has_orders, limit, offset } = req.query;

        const result = await this.leadService.getLeads(tenantId, {
            status: status as any,
            source: source as any,
            assigned_to: assigned_to as string,
            tags: tags ? (tags as string).split(',') : undefined,
            search: search as string,
            has_orders: has_orders !== undefined ? has_orders === 'true' : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        });

        ApiResponse.success(res, result);
    });

    getLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const lead = await this.leadService.getLead(tenantId, req.params.id);
        if (!lead) throw new AppError('Lead not found', 404);

        ApiResponse.success(res, { lead });
    });

    getLeadByPhone = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const lead = await this.leadService.getLeadByPhone(tenantId, req.params.phone);
        if (!lead) throw new AppError('Lead not found', 404);

        ApiResponse.success(res, { lead });
    });

    createLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { phone, name, email, source, tags, notes, collected_data, interest_categories } = req.body;
        
        if (!phone) throw new AppError('Phone number is required', 400);

        const lead = await this.leadService.createLead(tenantId, {
            phone,
            name,
            email,
            source,
            tags,
            notes,
            collected_data,
            interest_categories,
        });

        ApiResponse.created(res, { lead });
    });

    updateLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const lead = await this.leadService.updateLead(tenantId, req.params.id, req.body);
        if (!lead) throw new AppError('Lead not found', 404);

        ApiResponse.success(res, { lead });
    });

    deleteLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const deleted = await this.leadService.deleteLead(tenantId, req.params.id);
        if (!deleted) throw new AppError('Lead not found', 404);

        ApiResponse.success(res, { success: true });
    });

    // ============================
    // STATUS & ASSIGNMENT
    // ============================

    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { status } = req.body;
        if (!status) throw new AppError('Status is required', 400);

        const validStatuses = ['new', 'contacted', 'qualified', 'interested', 'negotiating', 'converted', 'lost'];
        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }

        const lead = await this.leadService.updateLead(tenantId, req.params.id, { status });
        if (!lead) throw new AppError('Lead not found', 404);

        ApiResponse.success(res, { lead });
    });

    assignLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        const userId = (req as any).user?.id;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { assigned_to } = req.body;
        if (!assigned_to) throw new AppError('assigned_to is required', 400);

        const lead = await this.leadService.assignLead(tenantId, req.params.id, assigned_to, userId);
        if (!lead) throw new AppError('Lead not found', 404);

        ApiResponse.success(res, { lead });
    });

    // ============================
    // TAGS
    // ============================

    addTag = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { tag } = req.body;
        if (!tag) throw new AppError('Tag is required', 400);

        const lead = await this.leadService.addTag(tenantId, req.params.id, tag);
        if (!lead) throw new AppError('Lead not found', 404);

        ApiResponse.success(res, { lead });
    });

    removeTag = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { tag } = req.body;
        if (!tag) throw new AppError('Tag is required', 400);

        const lead = await this.leadService.removeTag(tenantId, req.params.id, tag);
        if (!lead) throw new AppError('Lead not found', 404);

        ApiResponse.success(res, { lead });
    });

    // ============================
    // ACTIVITIES
    // ============================

    getActivities = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const activities = await this.leadService.getActivities(tenantId, req.params.id, limit);

        ApiResponse.success(res, { activities });
    });

    // ============================
    // STATISTICS
    // ============================

    getStats = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const stats = await this.leadService.getStats(tenantId);

        ApiResponse.success(res, { stats });
    });

    // ============================
    // BULK OPERATIONS
    // ============================

    bulkUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new AppError('ids array is required', 400);
        }
        if (!status) throw new AppError('status is required', 400);

        const count = await this.leadService.bulkUpdateStatus(tenantId, ids, status);

        ApiResponse.success(res, { updated: count });
    });

    bulkAssign = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { ids, assigned_to } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new AppError('ids array is required', 400);
        }
        if (!assigned_to) throw new AppError('assigned_to is required', 400);

        const count = await this.leadService.bulkAssign(tenantId, ids, assigned_to);

        ApiResponse.success(res, { updated: count });
    });

    bulkAddTag = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);

        const { ids, tag } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new AppError('ids array is required', 400);
        }
        if (!tag) throw new AppError('tag is required', 400);

        const count = await this.leadService.bulkAddTag(tenantId, ids, tag);

        ApiResponse.success(res, { updated: count });
    });
}
