import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface DepartmentAttributes {
    id: string;
    tenant_id: string;
    name: string;
    code?: string;
    description?: string;
    parent_id?: string;
    head_employee_id?: string;
    budget_amount?: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'is_active'> {}

export class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
    public id!: string;
    public tenant_id!: string;
    public name!: string;
    public code?: string;
    public description?: string;
    public parent_id?: string;
    public head_employee_id?: string;
    public budget_amount?: number;
    public is_active!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
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
