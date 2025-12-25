import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface EmployeeAttributes {
    id: string;
    tenant_id: string;
    user_id?: string;
    employee_code: string;
    first_name: string;
    last_name?: string;
    preferred_name?: string;
    type?: string;
    category?: string;
    branch_id?: string;
    department_id?: string;
    reporting_to?: string;
    cost_center_id?: string;
    joining_date?: Date;
    probation_end_date?: Date;
    confirmation_date?: Date;
    lifecycle_stage?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'id' | 'is_active'> {}

export class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
    public id!: string;
    public tenant_id!: string;
    public user_id?: string;
    public employee_code!: string;
    public first_name!: string;
    public last_name?: string;
    public preferred_name?: string;
    public type?: string;
    public category?: string;
    public branch_id?: string;
    public department_id?: string;
    public reporting_to?: string;
    public cost_center_id?: string;
    public joining_date?: Date;
    public probation_end_date?: Date;
    public confirmation_date?: Date;
    public lifecycle_stage?: string;
    public is_active!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
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
    },
    {
        sequelize,
        tableName: 'employees',
        underscored: true,
        timestamps: true,
    }
);
