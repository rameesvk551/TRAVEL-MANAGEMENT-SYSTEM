import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Attendance extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Attendance.init(
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
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        work_hours: DataTypes.DECIMAL,
        overtime_hours: DataTypes.DECIMAL,
        type: DataTypes.STRING,
        status: DataTypes.STRING,
        trip_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'attendance',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

    return Attendance;
};
