import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface PaymentAttributes {
    id: string;
    tenant_id: string;
    booking_id: string;
    payment_type: string;
    method?: string;
    amount: number;
    currency?: string;
    status: string;
    gateway?: string;
    gateway_payment_id?: string;
    gateway_order_id?: string;
    payment_link_id?: string;
    payment_link_url?: string;
    link_expires_at?: Date;
    link_sent_at?: Date;
    received_by_id?: string;
    receipt_number?: string;
    refund_amount?: number;
    refund_reason?: string;
    refunded_at?: Date;
    notes?: string;
    created_at?: Date;
    completed_at?: Date;
    failed_at?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    public id!: string;
    public tenant_id!: string;
    public booking_id!: string;
    public payment_type!: string;
    public method?: string;
    public amount!: number;
    public currency?: string;
    public status!: string;
    public gateway?: string;
    public gateway_payment_id?: string;
    public gateway_order_id?: string;
    public payment_link_id?: string;
    public payment_link_url?: string;
    public link_expires_at?: Date;
    public link_sent_at?: Date;
    public received_by_id?: string;
    public receipt_number?: string;
    public refund_amount?: number;
    public refund_reason?: string;
    public refunded_at?: Date;
    public notes?: string;
    public readonly created_at!: Date;
    public completed_at?: Date;
    public failed_at?: Date;
}

Payment.init(
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
        booking_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        payment_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        method: DataTypes.STRING,
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        currency: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        gateway: DataTypes.STRING,
        gateway_payment_id: DataTypes.STRING,
        gateway_order_id: DataTypes.STRING,
        payment_link_id: DataTypes.STRING,
        payment_link_url: DataTypes.TEXT,
        link_expires_at: DataTypes.DATE,
        link_sent_at: DataTypes.DATE,
        received_by_id: DataTypes.UUID,
        receipt_number: DataTypes.STRING,
        refund_amount: DataTypes.DECIMAL,
        refund_reason: DataTypes.TEXT,
        refunded_at: DataTypes.DATE,
        notes: DataTypes.TEXT,
        completed_at: DataTypes.DATE,
        failed_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'payments',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);
