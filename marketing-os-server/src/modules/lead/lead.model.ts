/**
 * Lead module Sequelize models.
 * Includes: Lead, LeadActivity, LeadPipelineStage, LeadNote,
 *           LeadScoringRule, LeadDuplicateRecord, LeadAssignmentRuleModel, LeadFollowUpReminderModel
 */

import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import type {
    LeadStatus, LeadSource, LeadCollectedData, BudgetRange,
    LeadActivityType,
} from './lead.types.js';

// ============================
// LEAD MODEL
// ============================

interface LeadAttributes {
    id: string;
    tenant_id: string;
    phone: string;
    name?: string;
    email?: string;
    status: LeadStatus;
    source: LeadSource;
    assigned_to?: string;
    tags: string[];
    collected_data: LeadCollectedData;
    interest_categories: string[];
    budget_range?: BudgetRange;
    location?: string;
    score: number;
    last_message_at?: Date;
    last_order_at?: Date;
    total_orders: number;
    total_spent: number;
    first_contact_at: Date;
    converted_at?: Date;
    notes?: string;
    custom_fields: Record<string, any>;
    // Enhancement fields
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    pipeline_stage_id?: string;
    company?: string;
    job_title?: string;
    last_activity_at?: Date;
    engagement_score: number;
    is_duplicate: boolean;
    duplicate_of?: string;
    created_at: Date;
    updated_at: Date;
}

interface LeadCreationAttributes extends Optional<LeadAttributes,
    'id' | 'name' | 'email' | 'assigned_to' | 'tags' | 'collected_data' |
    'interest_categories' | 'budget_range' | 'location' | 'score' |
    'last_message_at' | 'last_order_at' | 'total_orders' | 'total_spent' |
    'converted_at' | 'notes' | 'custom_fields' | 'created_at' | 'updated_at' |
    'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_term' | 'utm_content' |
    'pipeline_stage_id' | 'company' | 'job_title' | 'last_activity_at' |
    'engagement_score' | 'is_duplicate' | 'duplicate_of'
> { }

export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
    declare id: string;
    declare tenant_id: string;
    declare phone: string;
    declare name?: string;
    declare email?: string;
    declare status: LeadStatus;
    declare source: LeadSource;
    declare assigned_to?: string;
    declare tags: string[];
    declare collected_data: LeadCollectedData;
    declare interest_categories: string[];
    declare budget_range?: BudgetRange;
    declare location?: string;
    declare score: number;
    declare last_message_at?: Date;
    declare last_order_at?: Date;
    declare total_orders: number;
    declare total_spent: number;
    declare first_contact_at: Date;
    declare converted_at?: Date;
    declare notes?: string;
    declare custom_fields: Record<string, any>;
    declare utm_source?: string;
    declare utm_medium?: string;
    declare utm_campaign?: string;
    declare utm_term?: string;
    declare utm_content?: string;
    declare pipeline_stage_id?: string;
    declare company?: string;
    declare job_title?: string;
    declare last_activity_at?: Date;
    declare engagement_score: number;
    declare is_duplicate: boolean;
    declare duplicate_of?: string;
    declare created_at: Date;
    declare updated_at: Date;
}

// ============================
// LEAD ACTIVITY MODEL
// ============================

interface LeadActivityAttributes {
    id: string;
    lead_id: string;
    tenant_id: string;
    type: LeadActivityType;
    description: string;
    metadata?: Record<string, any>;
    performed_by?: string;
    created_at: Date;
}

interface LeadActivityCreationAttributes extends Optional<LeadActivityAttributes,
    'id' | 'metadata' | 'performed_by' | 'created_at'
> { }

export class LeadActivity extends Model<LeadActivityAttributes, LeadActivityCreationAttributes> implements LeadActivityAttributes {
    declare id: string;
    declare lead_id: string;
    declare tenant_id: string;
    declare type: LeadActivityType;
    declare description: string;
    declare metadata?: Record<string, any>;
    declare performed_by?: string;
    declare created_at: Date;
}

// ============================
// PIPELINE STAGE MODEL
// ============================

interface PipelineStageAttributes {
    id: string;
    tenant_id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
    position: number;
    is_default: boolean;
    is_won: boolean;
    is_lost: boolean;
    created_at: Date;
    updated_at: Date;
}

interface PipelineStageCreationAttributes extends Optional<PipelineStageAttributes,
    'id' | 'description' | 'color' | 'position' | 'is_default' | 'is_won' | 'is_lost' | 'created_at' | 'updated_at'
> { }

export class LeadPipelineStage extends Model<PipelineStageAttributes, PipelineStageCreationAttributes> implements PipelineStageAttributes {
    declare id: string;
    declare tenant_id: string;
    declare name: string;
    declare slug: string;
    declare description?: string;
    declare color: string;
    declare position: number;
    declare is_default: boolean;
    declare is_won: boolean;
    declare is_lost: boolean;
    declare created_at: Date;
    declare updated_at: Date;
}

// ============================
// LEAD NOTE MODEL
// ============================

interface LeadNoteAttributes {
    id: string;
    lead_id: string;
    tenant_id: string;
    content: string;
    is_internal: boolean;
    created_by?: string;
    updated_at: Date;
    created_at: Date;
}

interface LeadNoteCreationAttributes extends Optional<LeadNoteAttributes,
    'id' | 'is_internal' | 'created_by' | 'updated_at' | 'created_at'
> { }

export class LeadNoteModel extends Model<LeadNoteAttributes, LeadNoteCreationAttributes> implements LeadNoteAttributes {
    declare id: string;
    declare lead_id: string;
    declare tenant_id: string;
    declare content: string;
    declare is_internal: boolean;
    declare created_by?: string;
    declare updated_at: Date;
    declare created_at: Date;
}

// ============================
// LEAD SCORING RULE MODEL
// ============================

interface LeadScoringRuleAttributes {
    id: string;
    tenant_id: string;
    name: string;
    event_type: string;
    score_delta: number;
    conditions: Record<string, any>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

interface LeadScoringRuleCreationAttributes extends Optional<LeadScoringRuleAttributes,
    'id' | 'conditions' | 'is_active' | 'created_at' | 'updated_at'
> { }

export class LeadScoringRuleModel extends Model<LeadScoringRuleAttributes, LeadScoringRuleCreationAttributes> implements LeadScoringRuleAttributes {
    declare id: string;
    declare tenant_id: string;
    declare name: string;
    declare event_type: string;
    declare score_delta: number;
    declare conditions: Record<string, any>;
    declare is_active: boolean;
    declare created_at: Date;
    declare updated_at: Date;
}

// ============================
// LEAD DUPLICATE RECORD MODEL
// ============================

interface LeadDuplicateAttributes {
    id: string;
    tenant_id: string;
    lead_id: string;
    duplicate_lead_id: string;
    match_type: string;
    match_score: number;
    status: string;
    resolved_by?: string;
    resolved_at?: Date;
    created_at: Date;
}

interface LeadDuplicateCreationAttributes extends Optional<LeadDuplicateAttributes,
    'id' | 'match_score' | 'status' | 'resolved_by' | 'resolved_at' | 'created_at'
> { }

export class LeadDuplicateRecord extends Model<LeadDuplicateAttributes, LeadDuplicateCreationAttributes> implements LeadDuplicateAttributes {
    declare id: string;
    declare tenant_id: string;
    declare lead_id: string;
    declare duplicate_lead_id: string;
    declare match_type: string;
    declare match_score: number;
    declare status: string;
    declare resolved_by?: string;
    declare resolved_at?: Date;
    declare created_at: Date;
}

// ============================
// ASSIGNMENT RULE MODEL
// ============================

interface AssignmentRuleAttributes {
    id: string;
    tenant_id: string;
    name: string;
    strategy: string;
    conditions: Record<string, any>;
    agent_ids: string[];
    last_assigned_index: number;
    is_active: boolean;
    priority: number;
    created_at: Date;
    updated_at: Date;
}

interface AssignmentRuleCreationAttributes extends Optional<AssignmentRuleAttributes,
    'id' | 'conditions' | 'agent_ids' | 'last_assigned_index' | 'is_active' | 'priority' | 'created_at' | 'updated_at'
> { }

export class LeadAssignmentRuleModel extends Model<AssignmentRuleAttributes, AssignmentRuleCreationAttributes> implements AssignmentRuleAttributes {
    declare id: string;
    declare tenant_id: string;
    declare name: string;
    declare strategy: string;
    declare conditions: Record<string, any>;
    declare agent_ids: string[];
    declare last_assigned_index: number;
    declare is_active: boolean;
    declare priority: number;
    declare created_at: Date;
    declare updated_at: Date;
}

// ============================
// FOLLOW-UP REMINDER MODEL
// ============================

interface FollowUpReminderAttributes {
    id: string;
    lead_id: string;
    tenant_id: string;
    assigned_to?: string;
    due_date: Date;
    note?: string;
    status: string;
    completed_at?: Date;
    created_by?: string;
    created_at: Date;
}

interface FollowUpReminderCreationAttributes extends Optional<FollowUpReminderAttributes,
    'id' | 'assigned_to' | 'note' | 'status' | 'completed_at' | 'created_by' | 'created_at'
> { }

export class LeadFollowUpReminderModel extends Model<FollowUpReminderAttributes, FollowUpReminderCreationAttributes> implements FollowUpReminderAttributes {
    declare id: string;
    declare lead_id: string;
    declare tenant_id: string;
    declare assigned_to?: string;
    declare due_date: Date;
    declare note?: string;
    declare status: string;
    declare completed_at?: Date;
    declare created_by?: string;
    declare created_at: Date;
}

// ============================
// MODEL INITIALIZATION
// ============================

export function initLeadModels(sequelize: Sequelize) {
    // ── Lead ──
    Lead.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            tenant_id: { type: DataTypes.UUID, allowNull: false },
            phone: { type: DataTypes.STRING(50), allowNull: false },
            name: { type: DataTypes.STRING(255), allowNull: true },
            email: { type: DataTypes.STRING(255), allowNull: true },
            status: {
                type: DataTypes.ENUM('new', 'contacted', 'qualified', 'interested', 'negotiating', 'converted', 'lost'),
                defaultValue: 'new',
            },
            source: {
                type: DataTypes.ENUM('whatsapp', 'website', 'referral', 'import', 'manual', 'widget', 'form', 'csv', 'api'),
                defaultValue: 'whatsapp',
            },
            assigned_to: { type: DataTypes.UUID, allowNull: true },
            tags: { type: DataTypes.JSONB, defaultValue: [] },
            collected_data: { type: DataTypes.JSONB, defaultValue: {} },
            interest_categories: { type: DataTypes.JSONB, defaultValue: [] },
            budget_range: { type: DataTypes.JSONB, allowNull: true },
            location: { type: DataTypes.STRING(255), allowNull: true },
            score: { type: DataTypes.INTEGER, defaultValue: 0 },
            last_message_at: { type: DataTypes.DATE, allowNull: true },
            last_order_at: { type: DataTypes.DATE, allowNull: true },
            total_orders: { type: DataTypes.INTEGER, defaultValue: 0 },
            total_spent: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
            first_contact_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            converted_at: { type: DataTypes.DATE, allowNull: true },
            notes: { type: DataTypes.TEXT, allowNull: true },
            custom_fields: { type: DataTypes.JSONB, defaultValue: {} },
            // Enhancement fields
            utm_source: { type: DataTypes.STRING(255), allowNull: true },
            utm_medium: { type: DataTypes.STRING(255), allowNull: true },
            utm_campaign: { type: DataTypes.STRING(255), allowNull: true },
            utm_term: { type: DataTypes.STRING(255), allowNull: true },
            utm_content: { type: DataTypes.STRING(255), allowNull: true },
            pipeline_stage_id: { type: DataTypes.UUID, allowNull: true },
            company: { type: DataTypes.STRING(255), allowNull: true },
            job_title: { type: DataTypes.STRING(255), allowNull: true },
            last_activity_at: { type: DataTypes.DATE, allowNull: true },
            engagement_score: { type: DataTypes.INTEGER, defaultValue: 0 },
            is_duplicate: { type: DataTypes.BOOLEAN, defaultValue: false },
            duplicate_of: { type: DataTypes.UUID, allowNull: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            tableName: 'leads',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['phone'] },
                { fields: ['tenant_id', 'phone'], unique: true },
                { fields: ['status'] },
                { fields: ['source'] },
                { fields: ['assigned_to'] },
                { fields: ['score'] },
                { fields: ['created_at'] },
                { fields: ['pipeline_stage_id'] },
                { fields: ['utm_source'] },
                { fields: ['utm_campaign'] },
                { fields: ['engagement_score'] },
                { fields: ['last_activity_at'] },
            ],
        }
    );

    // ── LeadActivity ──
    LeadActivity.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            lead_id: { type: DataTypes.UUID, allowNull: false },
            tenant_id: { type: DataTypes.UUID, allowNull: false },
            type: { type: DataTypes.STRING(50), allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: false },
            metadata: { type: DataTypes.JSONB, defaultValue: {} },
            performed_by: { type: DataTypes.UUID, allowNull: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            tableName: 'lead_activities',
            timestamps: false,
            indexes: [
                { fields: ['lead_id'] },
                { fields: ['tenant_id'] },
                { fields: ['type'] },
                { fields: ['created_at'] },
            ],
        }
    );

    // ── LeadPipelineStage ──
    LeadPipelineStage.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            tenant_id: { type: DataTypes.UUID, allowNull: false },
            name: { type: DataTypes.STRING(100), allowNull: false },
            slug: { type: DataTypes.STRING(100), allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            color: { type: DataTypes.STRING(7), defaultValue: '#4F46E5' },
            position: { type: DataTypes.INTEGER, defaultValue: 0 },
            is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
            is_won: { type: DataTypes.BOOLEAN, defaultValue: false },
            is_lost: { type: DataTypes.BOOLEAN, defaultValue: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            tableName: 'lead_pipeline_stages',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['tenant_id', 'position'] },
                { fields: ['tenant_id', 'slug'], unique: true },
            ],
        }
    );

    // ── LeadNote ──
    LeadNoteModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            lead_id: { type: DataTypes.UUID, allowNull: false },
            tenant_id: { type: DataTypes.UUID, allowNull: false },
            content: { type: DataTypes.TEXT, allowNull: false },
            is_internal: { type: DataTypes.BOOLEAN, defaultValue: false },
            created_by: { type: DataTypes.UUID, allowNull: true },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            tableName: 'lead_notes',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['lead_id'] },
                { fields: ['tenant_id'] },
            ],
        }
    );

    // ── LeadScoringRule ──
    LeadScoringRuleModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            tenant_id: { type: DataTypes.UUID, allowNull: false },
            name: { type: DataTypes.STRING(100), allowNull: false },
            event_type: { type: DataTypes.STRING(50), allowNull: false },
            score_delta: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            conditions: { type: DataTypes.JSONB, defaultValue: {} },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            tableName: 'lead_scoring_rules',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['event_type'] },
            ],
        }
    );

    // ── LeadDuplicate ──
    LeadDuplicateRecord.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            tenant_id: { type: DataTypes.UUID, allowNull: false },
            lead_id: { type: DataTypes.UUID, allowNull: false },
            duplicate_lead_id: { type: DataTypes.UUID, allowNull: false },
            match_type: { type: DataTypes.STRING(30), allowNull: false },
            match_score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
            status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
            resolved_by: { type: DataTypes.UUID, allowNull: true },
            resolved_at: { type: DataTypes.DATE, allowNull: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            tableName: 'lead_duplicates',
            timestamps: false,
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['lead_id'] },
                { fields: ['status'] },
            ],
        }
    );

    // ── LeadAssignmentRule ──
    LeadAssignmentRuleModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            tenant_id: { type: DataTypes.UUID, allowNull: false },
            name: { type: DataTypes.STRING(100), allowNull: false },
            strategy: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'round_robin' },
            conditions: { type: DataTypes.JSONB, defaultValue: {} },
            agent_ids: { type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: [] },
            last_assigned_index: { type: DataTypes.INTEGER, defaultValue: 0 },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
            priority: { type: DataTypes.INTEGER, defaultValue: 0 },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            tableName: 'lead_assignment_rules',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['tenant_id'] },
            ],
        }
    );

    // ── LeadFollowUpReminder ──
    LeadFollowUpReminderModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            lead_id: { type: DataTypes.UUID, allowNull: false },
            tenant_id: { type: DataTypes.UUID, allowNull: false },
            assigned_to: { type: DataTypes.UUID, allowNull: true },
            due_date: { type: DataTypes.DATE, allowNull: false },
            note: { type: DataTypes.TEXT, allowNull: true },
            status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
            completed_at: { type: DataTypes.DATE, allowNull: true },
            created_by: { type: DataTypes.UUID, allowNull: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            tableName: 'lead_follow_up_reminders',
            timestamps: false,
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['lead_id'] },
                { fields: ['assigned_to'] },
                { fields: ['due_date'] },
            ],
        }
    );

    // ============================
    // ASSOCIATIONS
    // ============================

    Lead.hasMany(LeadActivity, { foreignKey: 'lead_id', as: 'activities' });
    LeadActivity.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

    Lead.belongsTo(LeadPipelineStage, { foreignKey: 'pipeline_stage_id', as: 'pipeline_stage' });
    LeadPipelineStage.hasMany(Lead, { foreignKey: 'pipeline_stage_id', as: 'leads' });

    Lead.hasMany(LeadNoteModel, { foreignKey: 'lead_id', as: 'lead_notes' });
    LeadNoteModel.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

    Lead.hasMany(LeadFollowUpReminderModel, { foreignKey: 'lead_id', as: 'follow_up_reminders' });
    LeadFollowUpReminderModel.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

    Lead.hasMany(LeadDuplicateRecord, { foreignKey: 'lead_id', as: 'duplicate_records' });
    LeadDuplicateRecord.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
}
