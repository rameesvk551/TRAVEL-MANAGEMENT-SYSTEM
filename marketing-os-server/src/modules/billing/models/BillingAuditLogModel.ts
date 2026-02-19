import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';

interface BillingAuditLogAttributes {
    id: string;
    tenant_id: string;
    actor_user_id?: string | null;
    action_type: string;
    reason?: string | null;
    before_state: Record<string, unknown>;
    after_state: Record<string, unknown>;
    metadata: Record<string, unknown>;
    created_at?: Date;
    updated_at?: Date;
}

type BillingAuditLogCreationAttributes = Optional<
    BillingAuditLogAttributes,
    'id' | 'actor_user_id' | 'reason' | 'before_state' | 'after_state' | 'metadata'
>;

export class BillingAuditLogModel
    extends Model<BillingAuditLogAttributes, BillingAuditLogCreationAttributes>
    implements BillingAuditLogAttributes {
    declare id: string;
    declare tenant_id: string;
    declare actor_user_id?: string | null;
    declare action_type: string;
    declare reason?: string | null;
    declare before_state: Record<string, unknown>;
    declare after_state: Record<string, unknown>;
    declare metadata: Record<string, unknown>;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BillingAuditLogModel.init(
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
        actor_user_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        action_type: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        before_state: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        after_state: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'billing_audit_logs',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ['tenant_id', 'created_at'],
                name: 'billing_audit_logs_tenant_created_idx',
            },
        ],
    },
);
