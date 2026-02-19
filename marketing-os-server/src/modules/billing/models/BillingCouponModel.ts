import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import type { BillingPlanType, CouponDiscountType, CouponScope } from '../billing.types.js';

interface BillingCouponAttributes {
    id: string;
    code: string;
    scope: CouponScope;
    discount_type: CouponDiscountType;
    discount_value: number;
    max_discount_amount_paise?: number | null;
    active: boolean;
    valid_from?: Date | null;
    valid_until?: Date | null;
    usage_limit?: number | null;
    used_count: number;
    applicable_plan_types: BillingPlanType[];
    razorpay_offer_id?: string | null;
    metadata: Record<string, unknown>;
    created_by_user_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

type BillingCouponCreationAttributes = Optional<
    BillingCouponAttributes,
    | 'id'
    | 'max_discount_amount_paise'
    | 'active'
    | 'valid_from'
    | 'valid_until'
    | 'usage_limit'
    | 'used_count'
    | 'applicable_plan_types'
    | 'razorpay_offer_id'
    | 'metadata'
    | 'created_by_user_id'
>;

export class BillingCouponModel
    extends Model<BillingCouponAttributes, BillingCouponCreationAttributes>
    implements BillingCouponAttributes {
    declare id: string;
    declare code: string;
    declare scope: CouponScope;
    declare discount_type: CouponDiscountType;
    declare discount_value: number;
    declare max_discount_amount_paise?: number | null;
    declare active: boolean;
    declare valid_from?: Date | null;
    declare valid_until?: Date | null;
    declare usage_limit?: number | null;
    declare used_count: number;
    declare applicable_plan_types: BillingPlanType[];
    declare razorpay_offer_id?: string | null;
    declare metadata: Record<string, unknown>;
    declare created_by_user_id?: string | null;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BillingCouponModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
        },
        scope: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'all',
        },
        discount_type: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        discount_value: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        max_discount_amount_paise: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        valid_from: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        valid_until: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        usage_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        used_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        applicable_plan_types: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        razorpay_offer_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
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
        tableName: 'billing_coupons',
        underscored: true,
        timestamps: true,
    },
);
