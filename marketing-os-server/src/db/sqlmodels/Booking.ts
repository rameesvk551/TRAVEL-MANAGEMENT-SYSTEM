import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Booking extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return Booking;
};
