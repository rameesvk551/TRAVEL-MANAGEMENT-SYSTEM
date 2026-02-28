import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class TripAssignment extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    TripAssignment.init(
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
        trip_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        role: DataTypes.STRING,
        is_primary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        start_date: DataTypes.DATEONLY,
        end_date: DataTypes.DATEONLY,
        status: DataTypes.STRING,
        total_compensation: DataTypes.DECIMAL,
    },
    {
        sequelize,
        tableName: 'trip_assignments',
        underscored: true,
        timestamps: false,
    }
);

    return TripAssignment;
};
