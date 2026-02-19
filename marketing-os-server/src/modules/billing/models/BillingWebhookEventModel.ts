import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';

interface BillingWebhookEventAttributes {
    id: string;
    event_id: string;
    event_type: string;
    tenant_id?: string | null;
    payload: Record<string, unknown>;
    processed_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

type BillingWebhookEventCreationAttributes = Optional<
    BillingWebhookEventAttributes,
    'id' | 'tenant_id' | 'payload' | 'processed_at'
>;

export class BillingWebhookEventModel
    extends Model<BillingWebhookEventAttributes, BillingWebhookEventCreationAttributes>
    implements BillingWebhookEventAttributes {
    declare id: string;
    declare event_id: string;
    declare event_type: string;
    declare tenant_id?: string | null;
    declare payload: Record<string, unknown>;
    declare processed_at: Date;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BillingWebhookEventModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        event_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        event_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        tenant_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        payload: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        processed_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'billing_webhook_events',
        underscored: true,
        timestamps: true,
    },
);
