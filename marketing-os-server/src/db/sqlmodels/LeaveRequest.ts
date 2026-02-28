import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class LeaveRequest extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    LeaveRequest.init(
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
        leave_type_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        from_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        to_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        total_days: DataTypes.DECIMAL,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        reason: DataTypes.TEXT,
        replacement_employee_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'leave_requests',
        underscored: true,
        timestamps: false,
    }
);

    return LeaveRequest;
};
