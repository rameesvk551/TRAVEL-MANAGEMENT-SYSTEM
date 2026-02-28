import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Department extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Department.init(
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        code: DataTypes.STRING,
        description: DataTypes.TEXT,
        parent_id: DataTypes.UUID,
        head_employee_id: DataTypes.UUID,
        budget_amount: DataTypes.DECIMAL,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'departments',
        underscored: true,
        timestamps: true,
    }
);

    return Department;
};
