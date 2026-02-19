import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'awaiting' | 'paid' | 'refunded';

interface StoreOrderAttributes {
    id: string;
    tenant_id: string;
    customer_phone: string;
    customer_name?: string;
    delivery_address?: string;
    items: any[];
    total_amount: number;
    currency: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_link?: string;
    notes?: string;
    conversation_id?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface StoreOrderCreationAttributes extends Optional<StoreOrderAttributes, 'id' | 'currency' | 'status' | 'payment_status'> { }

export class StoreOrder extends Model<StoreOrderAttributes, StoreOrderCreationAttributes> implements StoreOrderAttributes {
    public id!: string;
    public tenant_id!: string;
    public customer_phone!: string;
    public customer_name?: string;
    public delivery_address?: string;
    public items!: any[];
    public total_amount!: number;
    public currency!: string;
    public status!: OrderStatus;
    public payment_status!: PaymentStatus;
    public payment_link?: string;
    public notes?: string;
    public conversation_id?: string;
    public created_at?: Date;
    public updated_at?: Date;
}

StoreOrder.init(
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
        customer_phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        customer_name: DataTypes.STRING(255),
        delivery_address: DataTypes.TEXT,
        items: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'INR',
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'pending',
        },
        payment_status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'unpaid',
        },
        payment_link: DataTypes.TEXT,
        notes: DataTypes.TEXT,
        conversation_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'store_orders',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);
