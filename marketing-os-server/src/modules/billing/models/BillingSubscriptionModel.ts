import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import type { BillingPlanType, SubscriptionStatus } from '../billing.types.js';

interface BillingSubscriptionAttributes {
    id: string;
    tenant_id: string;
    plan_type: BillingPlanType;
    status: SubscriptionStatus;
    trial_start_at?: Date | null;
    trial_end_at?: Date | null;
    current_period_start?: Date | null;
    current_period_end?: Date | null;
    razorpay_customer_id?: string | null;
    razorpay_subscription_id?: string | null;
    last_payment_at?: Date | null;
    write_blocked_override: boolean;
    metadata: Record<string, unknown>;
    created_by_user_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

type BillingSubscriptionCreationAttributes = Optional<
    BillingSubscriptionAttributes,
    | 'id'
    | 'trial_start_at'
    | 'trial_end_at'
    | 'current_period_start'
    | 'current_period_end'
    | 'razorpay_customer_id'
    | 'razorpay_subscription_id'
    | 'last_payment_at'
    | 'write_blocked_override'
    | 'metadata'
    | 'created_by_user_id'
>;

export class BillingSubscriptionModel
    extends Model<BillingSubscriptionAttributes, BillingSubscriptionCreationAttributes>
    implements BillingSubscriptionAttributes {
    declare id: string;
    declare tenant_id: string;
    declare plan_type: BillingPlanType;
    declare status: SubscriptionStatus;
    declare trial_start_at?: Date | null;
    declare trial_end_at?: Date | null;
    declare current_period_start?: Date | null;
    declare current_period_end?: Date | null;
    declare razorpay_customer_id?: string | null;
    declare razorpay_subscription_id?: string | null;
    declare last_payment_at?: Date | null;
    declare write_blocked_override: boolean;
    declare metadata: Record<string, unknown>;
    declare created_by_user_id?: string | null;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BillingSubscriptionModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenant_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        plan_type: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'trial',
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'trialing',
        },
        trial_start_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        trial_end_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        current_period_start: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        current_period_end: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        razorpay_customer_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        razorpay_subscription_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        last_payment_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        write_blocked_override: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        created_by_user_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'billing_subscriptions',
        underscored: true,
        timestamps: true,
    },
);
