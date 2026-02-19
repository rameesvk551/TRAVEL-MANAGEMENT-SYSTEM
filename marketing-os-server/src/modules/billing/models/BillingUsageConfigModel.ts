import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import type { BillingPlanType, UsageFeatureConfig } from '../billing.types.js';

interface BillingUsageConfigAttributes {
    id: string;
    plan_type: BillingPlanType;
    feature_configs: UsageFeatureConfig[];
    updated_by_user_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

type BillingUsageConfigCreationAttributes = Optional<
    BillingUsageConfigAttributes,
    'id' | 'updated_by_user_id'
>;

export class BillingUsageConfigModel
    extends Model<BillingUsageConfigAttributes, BillingUsageConfigCreationAttributes>
    implements BillingUsageConfigAttributes {
    declare id: string;
    declare plan_type: BillingPlanType;
    declare feature_configs: UsageFeatureConfig[];
    declare updated_by_user_id?: string | null;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BillingUsageConfigModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        plan_type: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        feature_configs: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        updated_by_user_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'billing_usage_configs',
        underscored: true,
        timestamps: true,
    },
);
