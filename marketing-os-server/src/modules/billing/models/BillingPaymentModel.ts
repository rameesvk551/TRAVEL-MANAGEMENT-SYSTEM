import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import type { PaymentSourceType, PaymentStatus } from '../billing.types.js';

interface BillingPaymentAttributes {
    id: string;
    tenant_id: string;
    billing_invoice_id?: string | null;
    billing_subscription_id?: string | null;
    source_type: PaymentSourceType;
    status: PaymentStatus;
    amount_paise: number;
    currency: string;
    razorpay_payment_id?: string | null;
    razorpay_order_id?: string | null;
    razorpay_subscription_id?: string | null;
    failure_reason?: string | null;
    captured_at?: Date | null;
    raw_payload: Record<string, unknown>;
    created_at?: Date;
    updated_at?: Date;
}

type BillingPaymentCreationAttributes = Optional<
    BillingPaymentAttributes,
    | 'id'
    | 'billing_invoice_id'
    | 'billing_subscription_id'
    | 'status'
    | 'currency'
    | 'razorpay_payment_id'
    | 'razorpay_order_id'
    | 'razorpay_subscription_id'
    | 'failure_reason'
    | 'captured_at'
    | 'raw_payload'
>;

export class BillingPaymentModel
    extends Model<BillingPaymentAttributes, BillingPaymentCreationAttributes>
    implements BillingPaymentAttributes {
    declare id: string;
    declare tenant_id: string;
    declare billing_invoice_id?: string | null;
    declare billing_subscription_id?: string | null;
    declare source_type: PaymentSourceType;
    declare status: PaymentStatus;
    declare amount_paise: number;
    declare currency: string;
    declare razorpay_payment_id?: string | null;
    declare razorpay_order_id?: string | null;
    declare razorpay_subscription_id?: string | null;
    declare failure_reason?: string | null;
    declare captured_at?: Date | null;
    declare raw_payload: Record<string, unknown>;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BillingPaymentModel.init(
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
        billing_invoice_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        billing_subscription_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        source_type: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'created',
        },
        amount_paise: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING(8),
            allowNull: false,
            defaultValue: 'INR',
        },
        razorpay_payment_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        razorpay_order_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        razorpay_subscription_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        failure_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        captured_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        raw_payload: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'billing_payments',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ['tenant_id', 'created_at'],
                name: 'billing_payments_tenant_created_idx',
            },
        ],
    },
);
