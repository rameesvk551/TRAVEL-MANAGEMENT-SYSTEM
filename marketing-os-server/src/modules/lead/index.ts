// Models
export * from './lead.model.js';

// Types (explicitly exclude Model names to prevent collision)
export type {
    LeadStatus, LeadSource, LeadActivityType, UTMData,
    PipelineStage, CreatePipelineStageDTO, UpdatePipelineStageDTO, KanbanBoard,
    LeadNote, CreateLeadNoteDTO, UpdateLeadNoteDTO,
    LeadScoringRule, CreateLeadScoringRuleDTO,
    LeadDuplicateMatch,
    LeadAssignmentRule, CreateLeadAssignmentRuleDTO,
    LeadFollowUpReminder, CreateFollowUpReminderDTO,
    CSVImportRecord, CSVImportResult,
    LeadFilters, LeadCollectedData, CreateLeadDTO, UpdateLeadDTO,
    LeadStats, CreateLeadActivityDTO, ConversionFunnel, AgentPerformance, SourceAnalytics, LeadTrend
} from './lead.types.js';

export * from './lead.repository.js';
export * from './lead.service.js';
export * from './lead-pipeline.service.js';
export * from './lead-scoring.service.js';
export * from './lead-duplicate.service.js';
export * from './lead-assignment.service.js';
export * from './lead-note.service.js';
export * from './lead-followup.service.js';
export * from './lead-automation.service.js';
export * from './lead-analytics.service.js';
export * from './lead.controller.js';
export * from './lead.routes.js';

