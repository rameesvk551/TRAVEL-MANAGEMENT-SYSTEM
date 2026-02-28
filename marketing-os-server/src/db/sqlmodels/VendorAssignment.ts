import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class VendorAssignment extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    VendorAssignment.init(
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
        vendor_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        booking_id: DataTypes.UUID,
        resource_id: DataTypes.UUID,
        departure_id: DataTypes.UUID,
        assignment_type: DataTypes.STRING,
        service_start_date: DataTypes.DATEONLY,
        service_end_date: DataTypes.DATEONLY,
        rate_id: DataTypes.UUID,
        net_amount: DataTypes.DECIMAL,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
    },
    {
        sequelize,
        tableName: 'vendor_assignments',
        underscored: true,
        timestamps: true,
    }
);

    return VendorAssignment;
};
