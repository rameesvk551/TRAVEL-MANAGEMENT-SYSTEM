import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class SalaryAdvance extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    SalaryAdvance.init(
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
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        status: DataTypes.STRING,
        repayment_months: DataTypes.INTEGER,
    },
    {
        sequelize,
        tableName: 'salary_advances',
        underscored: true,
        timestamps: false,
    }
);

    return SalaryAdvance;
};
