import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import type { InvoiceStatus, InvoiceType } from '../billing.types.js';

export interface BillingInvoiceLineItem {
    featureKey: string;
    description: string;
    quantity: number;
    unitAmountPaise: number;
    amountPaise: number;
}

interface BillingInvoiceAttributes {
    id: string;
    tenant_id: string;
    invoice_type: InvoiceType;
    status: InvoiceStatus;
    cycle_start?: Date | null;
    cycle_end?: Date | null;
    line_items: BillingInvoiceLineItem[];
    subtotal_amount_paise: number;
    discount_amount_paise: number;
    total_amount_paise: number;
    currency: string;
    coupon_code?: string | null;
    due_at?: Date | null;
    issued_at?: Date | null;
    paid_at?: Date | null;
    razorpay_order_id?: string | null;
    razorpay_payment_id?: string | null;
    metadata: Record<string, unknown>;
    created_at?: Date;
    updated_at?: Date;
}

type BillingInvoiceCreationAttributes = Optional<
    BillingInvoiceAttributes,
    | 'id'
    | 'status'
    | 'cycle_start'
    | 'cycle_end'
    | 'line_items'
    | 'discount_amount_paise'
    | 'currency'
    | 'coupon_code'
    | 'due_at'
    | 'issued_at'
    | 'paid_at'
    | 'razorpay_order_id'
    | 'razorpay_payment_id'
    | 'metadata'
>;

export class BillingInvoiceModel
    extends Model<BillingInvoiceAttributes, BillingInvoiceCreationAttributes>
    implements BillingInvoiceAttributes {
    declare id: string;
    declare tenant_id: string;
    declare invoice_type: InvoiceType;
    declare status: InvoiceStatus;
    declare cycle_start?: Date | null;
    declare cycle_end?: Date | null;
    declare line_items: BillingInvoiceLineItem[];
    declare subtotal_amount_paise: number;
    declare discount_amount_paise: number;
    declare total_amount_paise: number;
    declare currency: string;
    declare coupon_code?: string | null;
    declare due_at?: Date | null;
    declare issued_at?: Date | null;
    declare paid_at?: Date | null;
    declare razorpay_order_id?: string | null;
    declare razorpay_payment_id?: string | null;
    declare metadata: Record<string, unknown>;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

BillingInvoiceModel.init(
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
        invoice_type: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'draft',
        },
        cycle_start: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        cycle_end: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        line_items: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        subtotal_amount_paise: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        discount_amount_paise: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_amount_paise: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING(8),
            allowNull: false,
            defaultValue: 'INR',
        },
        coupon_code: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        due_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        issued_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        paid_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        razorpay_order_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        razorpay_payment_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'billing_invoices',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ['tenant_id', 'status'],
                name: 'billing_invoices_tenant_status_idx',
            },
        ],
    },
);
