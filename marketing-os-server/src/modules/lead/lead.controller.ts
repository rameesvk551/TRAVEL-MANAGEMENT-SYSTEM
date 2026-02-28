/**
 * Lead controller — handles HTTP request/response only.
 * All business logic is in the various Lead services.
 */

import { Request, Response } from 'express';
import { LeadService } from './lead.service.js';
import { LeadPipelineService } from './lead-pipeline.service.js';
import { LeadNoteService } from './lead-note.service.js';
import { LeadFollowUpService } from './lead-followup.service.js';
import { LeadAnalyticsService } from './lead-analytics.service.js';
import { LeadScoringService } from './lead-scoring.service.js';
import { LeadDuplicateService } from './lead-duplicate.service.js';
import { LeadAssignmentService } from './lead-assignment.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/apiError.js';

export class LeadController {
    constructor(
        private readonly leadService: LeadService,
        private readonly pipelineService: LeadPipelineService,
        private readonly noteService: LeadNoteService,
        private readonly followUpService: LeadFollowUpService,
        private readonly analyticsService: LeadAnalyticsService,
        private readonly scoringService: LeadScoringService,
        private readonly duplicateService: LeadDuplicateService,
        private readonly assignmentService: LeadAssignmentService,
    ) { }

    private getTenantId(req: Request): string {
        const tenantId = (req as any).context?.tenantId;
        if (!tenantId) throw new AppError('Tenant required', 401);
        return tenantId;
    }

    private getUserId(req: Request): string | undefined {
        return (req as any).user?.id;
    }

    // ═══════════════════════════════════════
    // LEAD CRUD (existing endpoints preserved)
    // ═══════════════════════════════════════

    getLeads = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { status, source, assigned_to, tags, search, has_orders,
            pipeline_stage_id, min_score, max_score, utm_source, utm_campaign,
            is_duplicate, limit, offset } = req.query;

        const result = await this.leadService.getLeads(tenantId, {
            status: status as any, source: source as any,
            assigned_to: assigned_to as string,
            tags: tags ? (tags as string).split(',') : undefined,
            search: search as string,
            has_orders: has_orders !== undefined ? has_orders === 'true' : undefined,
            pipeline_stage_id: pipeline_stage_id as string,
            min_score: min_score ? parseInt(min_score as string) : undefined,
            max_score: max_score ? parseInt(max_score as string) : undefined,
            utm_source: utm_source as string,
            utm_campaign: utm_campaign as string,
            is_duplicate: is_duplicate !== undefined ? is_duplicate === 'true' : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        });
        ApiResponse.success(res, result);
    });

    getLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const lead = await this.leadService.getLead(tenantId, req.params.id);
        if (!lead) throw new AppError('Lead not found', 404);
        ApiResponse.success(res, { lead });
    });

    getLeadByPhone = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const lead = await this.leadService.getLeadByPhone(tenantId, req.params.phone);
        if (!lead) throw new AppError('Lead not found', 404);
        ApiResponse.success(res, { lead });
    });

    createLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { phone, name, email, source, tags, notes, collected_data, interest_categories,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            company, job_title, pipeline_stage_id, custom_fields } = req.body;
        if (!phone) throw new AppError('Phone number is required', 400);

        const lead = await this.leadService.createLead(tenantId, {
            phone, name, email, source, tags, notes, collected_data, interest_categories,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            company, job_title, pipeline_stage_id, custom_fields,
        });
        ApiResponse.created(res, { lead });
    });

    updateLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const lead = await this.leadService.updateLead(tenantId, req.params.id, req.body);
        if (!lead) throw new AppError('Lead not found', 404);
        ApiResponse.success(res, { lead });
    });

    deleteLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const deleted = await this.leadService.deleteLead(tenantId, req.params.id);
        if (!deleted) throw new AppError('Lead not found', 404);
        ApiResponse.success(res, { success: true });
    });

    // ═══════════════════════════════════════
    // STATUS & ASSIGNMENT
    // ═══════════════════════════════════════

    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { status } = req.body;
        if (!status) throw new AppError('Status is required', 400);
        const validStatuses = ['new', 'contacted', 'qualified', 'interested', 'negotiating', 'converted', 'lost'];
        if (!validStatuses.includes(status)) throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        const lead = await this.leadService.updateLead(tenantId, req.params.id, { status });
        if (!lead) throw new AppError('Lead not found', 404);
        ApiResponse.success(res, { lead });
    });

    assignLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const userId = this.getUserId(req);
        const { assigned_to } = req.body;
        if (!assigned_to) throw new AppError('assigned_to is required', 400);
        const lead = await this.leadService.assignLead(tenantId, req.params.id, assigned_to, userId);
        if (!lead) throw new AppError('Lead not found', 404);
        ApiResponse.success(res, { lead });
    });

    autoAssignLead = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const agentId = await this.assignmentService.autoAssign(tenantId, req.params.id);
        ApiResponse.success(res, { assigned_to: agentId });
    });

    // ═══════════════════════════════════════
    // TAGS
    // ═══════════════════════════════════════

    addTag = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { tag } = req.body;
        if (!tag) throw new AppError('Tag is required', 400);
        const lead = await this.leadService.addTag(tenantId, req.params.id, tag);
        if (!lead) throw new AppError('Lead not found', 404);
        ApiResponse.success(res, { lead });
    });

    removeTag = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { tag } = req.body;
        if (!tag) throw new AppError('Tag is required', 400);
        const lead = await this.leadService.removeTag(tenantId, req.params.id, tag);
        if (!lead) throw new AppError('Lead not found', 404);
        ApiResponse.success(res, { lead });
    });

    // ═══════════════════════════════════════
    // ACTIVITIES & TIMELINE
    // ═══════════════════════════════════════

    getActivities = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const activities = await this.leadService.getActivities(tenantId, req.params.id, limit);
        ApiResponse.success(res, { activities });
    });

    getTimeline = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const timeline = await this.leadService.getTimeline(tenantId, req.params.id, limit);
        ApiResponse.success(res, { timeline });
    });

    // ═══════════════════════════════════════
    // STATISTICS
    // ═══════════════════════════════════════

    getStats = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const stats = await this.leadService.getStats(tenantId);
        ApiResponse.success(res, { stats });
    });

    // ═══════════════════════════════════════
    // BULK OPERATIONS
    // ═══════════════════════════════════════

    bulkUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) throw new AppError('ids array is required', 400);
        if (!status) throw new AppError('status is required', 400);
        const count = await this.leadService.bulkUpdateStatus(tenantId, ids, status);
        ApiResponse.success(res, { updated: count });
    });

    bulkAssign = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { ids, assigned_to } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) throw new AppError('ids array is required', 400);
        if (!assigned_to) throw new AppError('assigned_to is required', 400);
        const count = await this.leadService.bulkAssign(tenantId, ids, assigned_to);
        ApiResponse.success(res, { updated: count });
    });

    bulkAddTag = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { ids, tag } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) throw new AppError('ids array is required', 400);
        if (!tag) throw new AppError('tag is required', 400);
        const count = await this.leadService.bulkAddTag(tenantId, ids, tag);
        ApiResponse.success(res, { updated: count });
    });

    // ═══════════════════════════════════════
    // PIPELINE STAGES
    // ═══════════════════════════════════════

    getPipelineStages = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const stages = await this.pipelineService.getStages(tenantId);
        ApiResponse.success(res, { stages });
    });

    createPipelineStage = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { name, slug, description, color, position, is_default, is_won, is_lost } = req.body;
        if (!name) throw new AppError('Stage name is required', 400);
        const stage = await this.pipelineService.createStage(tenantId, { name, slug, description, color, position, is_default, is_won, is_lost });
        ApiResponse.created(res, { stage });
    });

    updatePipelineStage = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const stage = await this.pipelineService.updateStage(tenantId, req.params.stageId, req.body);
        if (!stage) throw new AppError('Stage not found', 404);
        ApiResponse.success(res, { stage });
    });

    deletePipelineStage = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const deleted = await this.pipelineService.deleteStage(tenantId, req.params.stageId);
        if (!deleted) throw new AppError('Stage not found', 404);
        ApiResponse.success(res, { success: true });
    });

    getKanbanBoard = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const board = await this.pipelineService.getKanbanBoard(tenantId);
        ApiResponse.success(res, { board });
    });

    moveLeadToStage = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { stage_id } = req.body;
        if (!stage_id) throw new AppError('stage_id is required', 400);
        const moved = await this.pipelineService.moveToStage(tenantId, req.params.id, stage_id);
        if (!moved) throw new AppError('Lead or stage not found', 404);

        // Log activity
        await this.leadService.logActivity(tenantId, {
            lead_id: req.params.id, type: 'pipeline_stage_changed',
            description: `Moved to pipeline stage`, metadata: { stage_id },
            performed_by: this.getUserId(req),
        });

        ApiResponse.success(res, { success: true });
    });

    getLeadAging = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const aging = await this.pipelineService.getLeadAging(tenantId);
        ApiResponse.success(res, { aging });
    });

    seedPipelineStages = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const stages = await this.pipelineService.seedDefaultStages(tenantId);
        ApiResponse.success(res, { stages });
    });

    // ═══════════════════════════════════════
    // NOTES
    // ═══════════════════════════════════════

    getNotes = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const notes = await this.noteService.getNotes(tenantId, req.params.id);
        ApiResponse.success(res, { notes });
    });

    addNote = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { content, is_internal } = req.body;
        if (!content) throw new AppError('Note content is required', 400);
        const note = await this.noteService.addNote(tenantId, {
            lead_id: req.params.id, content, is_internal,
            created_by: this.getUserId(req),
        });

        await this.leadService.logActivity(tenantId, {
            lead_id: req.params.id,
            type: is_internal ? 'note_added_internal' : 'note_added',
            description: `Note added`, performed_by: this.getUserId(req),
        });

        ApiResponse.created(res, { note });
    });

    updateNote = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { content } = req.body;
        if (!content) throw new AppError('Note content is required', 400);
        const note = await this.noteService.updateNote(tenantId, req.params.noteId, { content });
        if (!note) throw new AppError('Note not found', 404);
        ApiResponse.success(res, { note });
    });

    deleteNote = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const deleted = await this.noteService.deleteNote(tenantId, req.params.noteId);
        if (!deleted) throw new AppError('Note not found', 404);
        ApiResponse.success(res, { success: true });
    });

    // ═══════════════════════════════════════
    // FOLLOW-UP REMINDERS
    // ═══════════════════════════════════════

    createFollowUp = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { lead_id, assigned_to, due_date, note } = req.body;
        if (!lead_id || !due_date) throw new AppError('lead_id and due_date are required', 400);
        const reminder = await this.followUpService.createReminder(tenantId, {
            lead_id, assigned_to, due_date: new Date(due_date), note,
        }, this.getUserId(req));

        await this.leadService.logActivity(tenantId, {
            lead_id, type: 'follow_up_set',
            description: `Follow-up set for ${new Date(due_date).toLocaleDateString()}`,
            performed_by: this.getUserId(req),
        });

        ApiResponse.created(res, { reminder });
    });

    getFollowUps = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { lead_id, assigned_to, status } = req.query;
        const reminders = await this.followUpService.getReminders(tenantId, {
            lead_id: lead_id as string, assigned_to: assigned_to as string, status: status as string,
        });
        ApiResponse.success(res, { reminders });
    });

    getOverdueFollowUps = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const reminders = await this.followUpService.getOverdue(tenantId);
        ApiResponse.success(res, { reminders });
    });

    completeFollowUp = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const completed = await this.followUpService.completeReminder(tenantId, req.params.reminderId);
        if (!completed) throw new AppError('Reminder not found', 404);
        ApiResponse.success(res, { success: true });
    });

    cancelFollowUp = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const cancelled = await this.followUpService.cancelReminder(tenantId, req.params.reminderId);
        if (!cancelled) throw new AppError('Reminder not found', 404);
        ApiResponse.success(res, { success: true });
    });

    // ═══════════════════════════════════════
    // SCORING RULES
    // ═══════════════════════════════════════

    getScoringRules = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const rules = await this.scoringService.getRules(tenantId);
        ApiResponse.success(res, { rules });
    });

    createScoringRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { name, event_type, score_delta, conditions, is_active } = req.body;
        if (!name || !event_type) throw new AppError('name and event_type are required', 400);
        const rule = await this.scoringService.createRule(tenantId, { name, event_type, score_delta: score_delta || 0, conditions, is_active });
        ApiResponse.created(res, { rule });
    });

    updateScoringRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const rule = await this.scoringService.updateRule(tenantId, req.params.ruleId, req.body);
        if (!rule) throw new AppError('Rule not found', 404);
        ApiResponse.success(res, { rule });
    });

    deleteScoringRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const deleted = await this.scoringService.deleteRule(tenantId, req.params.ruleId);
        if (!deleted) throw new AppError('Rule not found', 404);
        ApiResponse.success(res, { success: true });
    });

    recalculateScore = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const score = await this.scoringService.recalculateScore(tenantId, req.params.id);
        ApiResponse.success(res, { score });
    });

    // ═══════════════════════════════════════
    // DUPLICATES
    // ═══════════════════════════════════════

    getPendingDuplicates = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const duplicates = await this.duplicateService.getPendingDuplicates(tenantId);
        ApiResponse.success(res, { duplicates });
    });

    dismissDuplicate = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const dismissed = await this.duplicateService.dismissDuplicate(tenantId, req.params.duplicateId, this.getUserId(req));
        if (!dismissed) throw new AppError('Duplicate record not found', 404);
        ApiResponse.success(res, { success: true });
    });

    mergeDuplicates = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { primary_lead_id, duplicate_lead_id } = req.body;
        if (!primary_lead_id || !duplicate_lead_id) throw new AppError('primary_lead_id and duplicate_lead_id are required', 400);
        const merged = await this.duplicateService.mergeDuplicates(tenantId, primary_lead_id, duplicate_lead_id, this.getUserId(req));
        if (!merged) throw new AppError('Could not merge leads', 400);
        ApiResponse.success(res, { success: true });
    });

    scanDuplicates = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const found = await this.duplicateService.batchScan(tenantId);
        ApiResponse.success(res, { duplicates_found: found });
    });

    // ═══════════════════════════════════════
    // ASSIGNMENT RULES
    // ═══════════════════════════════════════

    getAssignmentRules = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const rules = await this.assignmentService.getRules(tenantId);
        ApiResponse.success(res, { rules });
    });

    createAssignmentRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { name, strategy, conditions, agent_ids, priority } = req.body;
        if (!name || !agent_ids) throw new AppError('name and agent_ids are required', 400);
        const rule = await this.assignmentService.createRule(tenantId, { name, strategy: strategy || 'round_robin', conditions, agent_ids, priority });
        ApiResponse.created(res, { rule });
    });

    updateAssignmentRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const rule = await this.assignmentService.updateRule(tenantId, req.params.ruleId, req.body);
        if (!rule) throw new AppError('Rule not found', 404);
        ApiResponse.success(res, { rule });
    });

    deleteAssignmentRule = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const deleted = await this.assignmentService.deleteRule(tenantId, req.params.ruleId);
        if (!deleted) throw new AppError('Rule not found', 404);
        ApiResponse.success(res, { success: true });
    });

    // ═══════════════════════════════════════
    // ANALYTICS
    // ═══════════════════════════════════════

    getConversionFunnel = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { start, end } = req.query;
        const funnel = await this.analyticsService.getConversionFunnel(tenantId, {
            start: start ? new Date(start as string) : undefined,
            end: end ? new Date(end as string) : undefined,
        });
        ApiResponse.success(res, { funnel });
    });

    getAgentPerformance = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { start, end } = req.query;
        const performance = await this.analyticsService.getAgentPerformance(tenantId, {
            start: start ? new Date(start as string) : undefined,
            end: end ? new Date(end as string) : undefined,
        });
        ApiResponse.success(res, { performance });
    });

    getSourceAnalytics = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { start, end } = req.query;
        const analytics = await this.analyticsService.getSourceAnalytics(tenantId, {
            start: start ? new Date(start as string) : undefined,
            end: end ? new Date(end as string) : undefined,
        });
        ApiResponse.success(res, { analytics });
    });

    getLeadTrend = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { start, end, group_by } = req.query;
        const trend = await this.analyticsService.getLeadTrend(tenantId, {
            start: start ? new Date(start as string) : undefined,
            end: end ? new Date(end as string) : undefined,
        }, (group_by as any) || 'day');
        ApiResponse.success(res, { trend });
    });

    getCampaignROI = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const campaigns = await this.analyticsService.getCampaignROI(tenantId);
        ApiResponse.success(res, { campaigns });
    });

    // ═══════════════════════════════════════
    // CSV IMPORT & WIDGET CAPTURE
    // ═══════════════════════════════════════

    importCSV = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { records } = req.body;
        if (!records || !Array.isArray(records)) throw new AppError('records array is required', 400);
        const result = await this.leadService.importFromCSV(tenantId, records);
        ApiResponse.success(res, { result });
    });

    captureFromWidget = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = this.getTenantId(req);
        const { phone, name, email, source, utm_source, utm_medium, utm_campaign } = req.body;
        if (!phone) throw new AppError('Phone number is required', 400);
        const { lead, isNew } = await this.leadService.captureFromWidget(tenantId, {
            phone, name, email, source, utm_source, utm_medium, utm_campaign,
        });
        ApiResponse.success(res, { lead, is_new: isNew });
    });
}
