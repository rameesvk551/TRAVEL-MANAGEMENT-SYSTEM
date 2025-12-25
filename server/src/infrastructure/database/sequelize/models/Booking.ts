import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

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
    confirmed_at?: Date;
    cancelled_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'status'> {}

export class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public resource_id?: string;
    public departure_id?: string;
    public lead_id?: string;
    public created_by_id?: string;
    public hold_id?: string;
    public booking_number!: string;
    public source?: string;
    public source_platform?: string;
    public external_ref?: string;
    public start_date?: Date;
    public end_date?: Date;
    public status!: string;
    public lifecycle_status?: string;
    public status_reason?: string;
    public guest_name!: string;
    public guest_email?: string;
    public guest_phone?: string;
    public guest_count?: number;
    public base_amount?: number;
    public tax_amount?: number;
    public total_amount?: number;
    public amount_paid?: number;
    public amount_due?: number;
    public currency?: string;
    public notes?: string;
    public confirmed_at?: Date;
    public cancelled_at?: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
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
