/**
 * Lead module routes.
 * Defines all API endpoints for CRM and Lead Intelligence.
 */

import { Router } from 'express';
import { LeadController } from './lead.controller.js';

export function createLeadRoutes(dependencies: {
    leadController: LeadController;
    authMiddleware: any;
    tenantMiddleware: any;
}): Router {
    const router = Router();
    const { leadController, authMiddleware, tenantMiddleware } = dependencies;

    // Apply middleware to all routes
    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // ============================
    // PIPELINE STAGES (Must be before /:id routes)
    // ============================
    router.get('/pipeline/stages', leadController.getPipelineStages);
    router.post('/pipeline/stages', leadController.createPipelineStage);
    router.put('/pipeline/stages/:stageId', leadController.updatePipelineStage);
    router.delete('/pipeline/stages/:stageId', leadController.deletePipelineStage);
    router.get('/pipeline/kanban', leadController.getKanbanBoard);
    router.get('/pipeline/aging', leadController.getLeadAging);
    router.post('/pipeline/seed-defaults', leadController.seedPipelineStages);

    // ============================
    // ANALYTICS (Must be before /:id routes)
    // ============================
    router.get('/analytics/conversion-funnel', leadController.getConversionFunnel);
    router.get('/analytics/agent-performance', leadController.getAgentPerformance);
    router.get('/analytics/source', leadController.getSourceAnalytics);
    router.get('/analytics/trend', leadController.getLeadTrend);
    router.get('/analytics/campaign-roi', leadController.getCampaignROI);

    // ============================
    // SCORING RULES
    // ============================
    router.get('/scoring-rules', leadController.getScoringRules);
    router.post('/scoring-rules', leadController.createScoringRule);
    router.put('/scoring-rules/:ruleId', leadController.updateScoringRule);
    router.delete('/scoring-rules/:ruleId', leadController.deleteScoringRule);

    // ============================
    // DUPLICATES
    // ============================
    router.get('/duplicates/pending', leadController.getPendingDuplicates);
    router.post('/duplicates/scan', leadController.scanDuplicates);
    router.post('/duplicates/merge', leadController.mergeDuplicates);
    router.post('/duplicates/:duplicateId/dismiss', leadController.dismissDuplicate);

    // ============================
    // ASSIGNMENT RULES
    // ============================
    router.get('/assignment-rules', leadController.getAssignmentRules);
    router.post('/assignment-rules', leadController.createAssignmentRule);
    router.put('/assignment-rules/:ruleId', leadController.updateAssignmentRule);
    router.delete('/assignment-rules/:ruleId', leadController.deleteAssignmentRule);

    // ============================
    // FOLLOW-UPS
    // ============================
    router.get('/follow-ups', leadController.getFollowUps);
    router.get('/follow-ups/overdue', leadController.getOverdueFollowUps);
    router.post('/follow-ups', leadController.createFollowUp);
    router.post('/follow-ups/:reminderId/complete', leadController.completeFollowUp);
    router.post('/follow-ups/:reminderId/cancel', leadController.cancelFollowUp);

    // ============================
    // IMPORT / CAPTURE
    // ============================
    router.post('/import/csv', leadController.importCSV);
    router.post('/capture', leadController.captureFromWidget);

    // ============================
    // LEAD BULK OPERATIONS
    // ============================
    router.post('/bulk/status', leadController.bulkUpdateStatus);
    router.post('/bulk/assign', leadController.bulkAssign);
    router.post('/bulk/tags', leadController.bulkAddTag);
    router.get('/stats', leadController.getStats);

    // ============================
    // LEAD INDIVIDUAL OPERATIONS
    // ============================
    router.get('/', leadController.getLeads);
    router.post('/', leadController.createLead);
    router.get('/phone/:phone', leadController.getLeadByPhone);
    router.get('/:id', leadController.getLead);
    router.put('/:id', leadController.updateLead);
    router.delete('/:id', leadController.deleteLead);

    // ── Status & Assignment ──
    router.put('/:id/status', leadController.updateStatus);
    router.put('/:id/assign', leadController.assignLead);
    router.post('/:id/auto-assign', leadController.autoAssignLead);
    router.put('/:id/pipeline-stage', leadController.moveLeadToStage);

    // ── Tags ──
    router.post('/:id/tags', leadController.addTag);
    router.delete('/:id/tags', leadController.removeTag);

    // ── Activities & Timeline ──
    router.get('/:id/activities', leadController.getActivities);
    router.get('/:id/timeline', leadController.getTimeline);

    // ── Notes ──
    router.get('/:id/notes', leadController.getNotes);
    router.post('/:id/notes', leadController.addNote);
    router.put('/notes/:noteId', leadController.updateNote);
    router.delete('/notes/:noteId', leadController.deleteNote);

    // ── Scoring ──
    router.post('/:id/recalculate-score', leadController.recalculateScore);

    return router;
}
