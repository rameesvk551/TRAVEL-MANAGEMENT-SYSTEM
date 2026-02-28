import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Employee extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Employee.init(
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
        user_id: DataTypes.UUID,
        employee_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: DataTypes.STRING,
        preferred_name: DataTypes.STRING,
        type: DataTypes.STRING,
        category: DataTypes.STRING,
        branch_id: DataTypes.UUID,
        department_id: DataTypes.UUID,
        reporting_to: DataTypes.UUID,
        cost_center_id: DataTypes.UUID,
        joining_date: DataTypes.DATEONLY,
        probation_end_date: DataTypes.DATEONLY,
        confirmation_date: DataTypes.DATEONLY,
        lifecycle_stage: DataTypes.STRING,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        contact: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        emergency_contacts: {
            type: DataTypes.JSONB,
            defaultValue: [],
        },
        attributes: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        created_by: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'employees',
        underscored: true,
        timestamps: true,
    }
);

    return Employee;
};
