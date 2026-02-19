/**
 * Automation module Sequelize models.
 */

import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import type {
    AutomationTriggerType,
    AutomationTriggerConfig,
    AutomationCondition,
    AutomationAction,
    ExecutedAction,
} from './automation.types.js';

// ============================
// AUTOMATION RULE MODEL
// ============================

interface AutomationRuleAttributes {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    trigger_type: AutomationTriggerType;
    trigger_config: AutomationTriggerConfig;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
    is_active: boolean;
    priority: number;
    cooldown_minutes?: number;
    max_executions_per_user?: number;
    created_at: Date;
    updated_at: Date;
}

interface AutomationRuleCreationAttributes extends Optional<AutomationRuleAttributes,
    'id' | 'description' | 'conditions' | 'is_active' | 'priority' |
    'cooldown_minutes' | 'max_executions_per_user' | 'created_at' | 'updated_at'
> {}

export class AutomationRule extends Model<AutomationRuleAttributes, AutomationRuleCreationAttributes> implements AutomationRuleAttributes {
    declare id: string;
    declare tenant_id: string;
    declare name: string;
    declare description?: string;
    declare trigger_type: AutomationTriggerType;
    declare trigger_config: AutomationTriggerConfig;
    declare conditions: AutomationCondition[];
    declare actions: AutomationAction[];
    declare is_active: boolean;
    declare priority: number;
    declare cooldown_minutes?: number;
    declare max_executions_per_user?: number;
    declare created_at: Date;
    declare updated_at: Date;
}

// ============================
// AUTOMATION EXECUTION MODEL
// ============================

interface AutomationExecutionAttributes {
    id: string;
    tenant_id: string;
    rule_id: string;
    lead_phone: string;
    lead_id?: string;
    trigger_type: AutomationTriggerType;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    actions_executed: ExecutedAction[];
    error_message?: string;
    scheduled_at: Date;
    started_at?: Date;
    completed_at?: Date;
    created_at: Date;
}

interface AutomationExecutionCreationAttributes extends Optional<AutomationExecutionAttributes,
    'id' | 'lead_id' | 'actions_executed' | 'error_message' | 'started_at' | 'completed_at' | 'created_at'
> {}

export class AutomationExecution extends Model<AutomationExecutionAttributes, AutomationExecutionCreationAttributes> implements AutomationExecutionAttributes {
    declare id: string;
    declare tenant_id: string;
    declare rule_id: string;
    declare lead_phone: string;
    declare lead_id?: string;
    declare trigger_type: AutomationTriggerType;
    declare status: 'pending' | 'executing' | 'completed' | 'failed';
    declare actions_executed: ExecutedAction[];
    declare error_message?: string;
    declare scheduled_at: Date;
    declare started_at?: Date;
    declare completed_at?: Date;
    declare created_at: Date;
}

// ============================
// INIT FUNCTION
// ============================

export function initAutomationModels(sequelize: Sequelize) {
    AutomationRule.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            trigger_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            trigger_config: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
            conditions: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            actions: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            priority: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            cooldown_minutes: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            max_executions_per_user: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'automation_rules',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['trigger_type'] },
                { fields: ['is_active'] },
                { fields: ['priority'] },
            ],
        }
    );

    AutomationExecution.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            rule_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            lead_phone: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            lead_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            trigger_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('pending', 'executing', 'completed', 'failed'),
                defaultValue: 'pending',
            },
            actions_executed: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            error_message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            scheduled_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            started_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            completed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'automation_executions',
            timestamps: false,
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['rule_id'] },
                { fields: ['lead_phone'] },
                { fields: ['status'] },
                { fields: ['scheduled_at'] },
                { fields: ['created_at'] },
            ],
        }
    );

    // Associations
    AutomationRule.hasMany(AutomationExecution, { foreignKey: 'rule_id', as: 'executions' });
    AutomationExecution.belongsTo(AutomationRule, { foreignKey: 'rule_id', as: 'rule' });
}
