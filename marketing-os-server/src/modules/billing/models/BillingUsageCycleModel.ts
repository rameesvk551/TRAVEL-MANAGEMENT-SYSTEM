import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import type { BillingPlanType, UsageFeatureCounter } from '../billing.types.js';

interface BillingUsageCycleAttributes {
    id: string;
    tenant_id: string;
    plan_type: BillingPlanType;
    cycle_start: Date;
    cycle_end: Date;
    feature_counters: UsageFeatureCounter[];
    total_overage_amount_paise: number;
    status: 'open' | 'invoiced';
    invoiced_invoice_id?: string | null;
    last_tracked_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

type BillingUsageCycleCreationAttributes = Optional<
    BillingUsageCycleAttributes,
    'id' | 'feature_counters' | 'total_overage_amount_paise' | 'status' | 'invoiced_invoice_id' | 'last_tracked_at'
>;

export class BillingUsageCycleModel
    extends Model<BillingUsageCycleAttributes, BillingUsageCycleCreationAttributes>
    implements BillingUsageCycleAttributes {
    declare id: string;
    declare tenant_id: string;
    declare plan_type: BillingPlanType;
    declare cycle_start: Date;
    declare cycle_end: Date;
    declare feature_counters: UsageFeatureCounter[];
    declare total_overage_amount_paise: number;
    declare status: 'open' | 'invoiced';
    declare invoiced_invoice_id?: string | null;
    declare last_tracked_at: Date;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BillingUsageCycleModel.init(
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
        plan_type: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'trial',
        },
        cycle_start: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        cycle_end: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        feature_counters: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        total_overage_amount_paise: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'open',
        },
        invoiced_invoice_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        last_tracked_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'billing_usage_cycles',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['tenant_id', 'cycle_start'],
                name: 'billing_usage_cycle_unique',
            },
        ],
    },
);
