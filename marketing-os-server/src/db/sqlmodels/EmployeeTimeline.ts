import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class EmployeeTimeline extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    EmployeeTimeline.init(
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
        event_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        event_category: DataTypes.STRING,
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        triggered_by: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'employee_timeline',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

    return EmployeeTimeline;
};
