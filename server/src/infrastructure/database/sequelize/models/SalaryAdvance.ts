import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface SalaryAdvanceAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    amount: number;
    status?: string;
    repayment_months?: number;
}

export interface SalaryAdvanceCreationAttributes extends Optional<SalaryAdvanceAttributes, 'id'> {}

export class SalaryAdvance extends Model<SalaryAdvanceAttributes, SalaryAdvanceCreationAttributes> implements SalaryAdvanceAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public amount!: number;
    public status?: string;
    public repayment_months?: number;
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
