import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface BookingAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    resource_id?: string;
    departure_id?: string;
    lead_id?: string;
    created_by_id?: string;
    hold_id?: string;
    booking_number: string;
    source?: string;
    source_platform?: string;
    external_ref?: string;
    start_date?: Date;
    end_date?: Date;
    status: string;
    lifecycle_status?: string;
    status_reason?: string;
    guest_name: string;
    guest_email?: string;
    guest_phone?: string;
    guest_count?: number;
    base_amount?: number;
    tax_amount?: number;
    total_amount?: number;
    amount_paid?: number;
    amount_due?: number;
    currency?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    confirmed_at?: Date;
    cancelled_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'status'> {}

export class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
    declare id: string;
    declare tenant_id: string;
    declare branch_id?: string;
    declare resource_id?: string;
    declare departure_id?: string;
    declare lead_id?: string;
    declare created_by_id?: string;
    declare hold_id?: string;
    declare booking_number: string;
    declare source?: string;
    declare source_platform?: string;
    declare external_ref?: string;
    declare start_date?: Date;
    declare end_date?: Date;
    declare status: string;
    declare lifecycle_status?: string;
    declare status_reason?: string;
    declare guest_name: string;
    declare guest_email?: string;
    declare guest_phone?: string;
    declare guest_count?: number;
    declare base_amount?: number;
    declare tax_amount?: number;
    declare total_amount?: number;
    declare amount_paid?: number;
    declare amount_due?: number;
    declare currency?: string;
    declare notes?: string;
    declare metadata?: Record<string, unknown>;
    declare confirmed_at?: Date;
    declare cancelled_at?: Date;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

Booking.init(
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
        branch_id: DataTypes.UUID,
        resource_id: DataTypes.UUID,
        departure_id: DataTypes.UUID,
        lead_id: DataTypes.UUID,
        created_by_id: DataTypes.UUID,
        hold_id: DataTypes.UUID,
        booking_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        source: DataTypes.STRING,
        source_platform: DataTypes.STRING,
        external_ref: DataTypes.STRING,
        start_date: DataTypes.DATEONLY,
        end_date: DataTypes.DATEONLY,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        lifecycle_status: DataTypes.STRING,
        status_reason: DataTypes.STRING,
        guest_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        guest_email: DataTypes.STRING,
        guest_phone: DataTypes.STRING,
        guest_count: DataTypes.INTEGER,
        base_amount: DataTypes.DECIMAL,
        tax_amount: DataTypes.DECIMAL,
        total_amount: DataTypes.DECIMAL,
        amount_paid: DataTypes.DECIMAL,
        amount_due: DataTypes.DECIMAL,
        currency: DataTypes.STRING,
        notes: DataTypes.TEXT,
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        confirmed_at: DataTypes.DATE,
        cancelled_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'bookings',
        underscored: true,
        timestamps: true,
    }
);
