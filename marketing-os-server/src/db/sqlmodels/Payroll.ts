import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Payroll extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Payroll.init(
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
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        gross_salary: DataTypes.DECIMAL,
        net_salary: DataTypes.DECIMAL,
        status: DataTypes.STRING,
        payment_date: DataTypes.DATEONLY,
    },
    {
        sequelize,
        tableName: 'payroll',
        underscored: true,
        timestamps: false,
    }
);

    return Payroll;
};
