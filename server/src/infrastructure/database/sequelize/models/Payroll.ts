import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface PayrollAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    year: number;
    month: number;
    gross_salary?: number;
    net_salary?: number;
    status?: string;
    payment_date?: Date;
}

export interface PayrollCreationAttributes extends Optional<PayrollAttributes, 'id'> {}

export class Payroll extends Model<PayrollAttributes, PayrollCreationAttributes> implements PayrollAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public year!: number;
    public month!: number;
    public gross_salary?: number;
    public net_salary?: number;
    public status?: string;
    public payment_date?: Date;
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
